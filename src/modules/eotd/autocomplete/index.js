// src/modules/eotd/autocomplete/index.js
const { EmbedBuilder } = require('discord.js');

// ── Configuración ──
const SENTENCE_COUNT = 5;

// ── Prompt único (ambos idiomas en 1 sola llamada) ──
const SYSTEM_PROMPT = 'You are a language learning assistant. Always respond with valid JSON only, no other text, no markdown.';

const BILINGUAL_PROMPT = (count) => `Generate exactly ${count} fill-in-the-blank sentences for language learning.

CRITICAL: The "sentence" field MUST contain "___" (three underscores) where the missing word goes. NEVER write the answer inside the sentence.

Return a JSON object with exactly TWO keys: "english" and "spanish".
Each key contains an array of ${count} objects, each with "sentence" and "answer".

RULES:
- ALWAYS use exactly ___ (3 underscores) for the blank in the sentence
- NEVER put the answer word inside the sentence — only ___
- English and Spanish sentences MUST be about COMPLETELY DIFFERENT topics. They must NOT be translations of each other.
  Example: If English is about "weather", Spanish should be about "food" or "work" — anything else.
- Cover different grammar structures (present, past, future, etc.)
- VARY the blank type: mix VERBS, NOUNS, ADJECTIVES, ADVERBS, PREPOSITIONS
- Do NOT repeat the same answer word across sentences
- The subject of each sentence must always be clearly shown (not the blank)
- MINIMUM answer length: the blank word MUST be at least 5 letters long (5+ characters)
- PROPER CAPITALIZATION: each sentence must start with a capital letter and use correct punctuation

Valid example — DIFFERENT topics, min 5 letters, proper caps:
{"english":[{"sentence":"The children are very ___ about the trip.","answer":"excited"}],"spanish":[{"sentence":"Ayer compré un ___ nuevo en la tienda.","answer":"vestido"}]}`;

/**
 * Duerme N milisegundos.
 */
const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * Llama a Groq UNA SOLA VEZ para oraciones en ambos idiomas.
 * @param {number} count - Cantidad de oraciones por idioma
 * @param {number} retries - Intentos restantes
 * @returns {Promise<{english: Array, spanish: Array}>}
 */
async function generateBilingualFromGroq(count = SENTENCE_COUNT, retries = 3) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY no configurada en .env');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: BILINGUAL_PROMPT(count) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 429 && retries > 0) {
      console.log(`[Autocomplete] Groq rate limit — reintentando en 30s... (quedan ${retries})`);
      await sleep(30_000);
      return generateBilingualFromGroq(count, retries - 1);
    }
    throw new Error(`Groq API error ${response.status}: ${errorText.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq: respuesta vacía');

  const parsed = JSON.parse(content);

  if (!parsed || !Array.isArray(parsed.english) || !Array.isArray(parsed.spanish)) {
    throw new Error('Groq no devolvió el formato esperado');
  }

  const validate = (arr, lang) => arr.slice(0, count).map((item, i) => {
    if (!item.sentence || !item.answer) throw new Error(`${lang}[${i}] sin sentence/answer`);
    const sentence = item.sentence.trim();
    // Rechazar si no contiene ___ — la IA puso la respuesta en vez del blank
    if (!sentence.includes('___')) {
      throw new Error(`${lang}[${i}]: falta "___" en la oración. La IA puso: "${sentence}"`);
    }
    return { sentence, answer: item.answer.trim() };
  });

  return {
    english: validate(parsed.english, 'english'),
    spanish: validate(parsed.spanish, 'spanish'),
  };
}

/**
 * Obtiene oraciones bilingües (un solo call a Groq).
 * Sin fallback — si falla la API, el error se propaga al comando.
 * @returns {Promise<{english: Array, spanish: Array}>}
 */
async function getBilingualSentences(count = SENTENCE_COUNT) {
  const result = await generateBilingualFromGroq(count);
  console.log(`[Autocomplete] Groq OK — EN: ${result.english.length}, ES: ${result.spanish.length}`);
  return result;
}

/**
 * Construye la oración con el blank modificado:
 * - La primera letra de la respuesta visible
 * - El resto son underscores (uno por letra faltante)
 * Ej: answer="wake" → "I usually w___ at 7 a.m."
 */
function buildHintSentence(sentence, answer) {
  if (!answer || answer.length === 0) return sentence;
  const firstLetter = answer[0];
  const remaining = '_'.repeat(answer.length - 1);
  const hintBlank = `${firstLetter}${remaining}`;
  return sentence.replace(/_{3,}/g, hintBlank);
}

// ── Mensajes bilingües ──
const INSTRUCCIONES = {
  spanish: {
    title: '🧩 Ejercicio de Autocompletar',
    desc: [
      '¡Hoy tenemos **5 oraciones** para completar!',
      '',
      '**Cómo funciona:**',
      '1️⃣ Lee cada oración',
      '2️⃣ Pensá en la palabra faltante',
      '3️⃣ Presioná **"Responder"** en el mensaje de la oración y escribí tu respuesta',
      '4️⃣ El bot te va a reaccionar con ✅ o ❌ automáticamente',
      '',
      '💡 **Pista:** la primera letra de cada respuesta se muestra como ayuda.',
      '',
      '⬇️ **Las oraciones están abajo — respondé a cada una!**',
    ].join('\n'),
  },
  english: {
    title: '🧩 Autocomplete Exercise',
    desc: [
      'Today we have **5 sentences** to complete!',
      '',
      '**How it works:**',
      '1️⃣ Read each sentence below',
      '2️⃣ Think of the missing word',
      '3️⃣ Click **"Reply"** on the sentence message and type your answer',
      '4️⃣ The bot will react with ✅ or ❌ automatically',
      '',
      '💡 **Tip:** the first letter of each answer is shown as a hint.',
      '',
      '⬇️ **The sentences are below — reply to each one!**',
    ].join('\n'),
  },
};

const MENSAJES = {
  spanish: {
    embedTitle: (i) => `🧩 #${i} — Completa la oración`,
    footer: 'Responde a este mensaje con tu palabra • Las respuestas serán reveladas mañana',
  },
  english: {
    embedTitle: (i) => `🧩 #${i} — Complete the sentence`,
    footer: 'Reply to this message with your word • Answers will be revealed tomorrow',
  },
};

/**
 * Envía los mensajes de autocomplete para un idioma específico a un canal.
 * @returns {Object} { channelId, channelName, messageIds, firstMessageId, sentences }
 */
async function sendToChannel(canal, idioma, sentences, roles, client) {
  const msg = MENSAJES[idioma];
  const inst = INSTRUCCIONES[idioma];
  const rolId = roles[idioma];
  const mencionRol = /^\d{17,20}$/.test((rolId || '').trim()) ? `<@&${rolId.trim()}>` : undefined;

  // 1. Enviar mensaje de instrucciones (con mención al rol, si aplica)
  const instruccionEmbed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(inst.title)
    .setDescription(inst.desc)
    .setTimestamp();

  await canal.send({
    content: mencionRol,
    embeds: [instruccionEmbed],
  });

  // 2. Enviar cada oración (sin mención de rol para evitar spam de pings)
  const messageIds = [];

  for (let i = 0; i < sentences.length; i++) {
    const { sentence, answer } = sentences[i];
    const hintSentence = buildHintSentence(sentence, answer);

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(msg.embedTitle(i + 1))
      .setDescription(`📝 ${hintSentence}`)
      .setFooter({ text: msg.footer })
      .setTimestamp();

    const sent = await canal.send({ embeds: [embed] });

    messageIds.push(sent.id);

    if (client.autocompleteCache) {
      client.autocompleteCache.set(sent.id, {
        channelId: canal.id,
        correctAnswer: answer,
        fullSentence: hintSentence,
        language: idioma,
      });
    }
  }

  return {
    channelId: canal.id,
    channelName: idioma,
    messageIds,
    firstMessageId: messageIds[0],
    sentences: sentences.map(s => ({ sentence: s.sentence, answer: s.answer })),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Envía ejercicios de autocomplete desde un comando slash.
 * UNA SOLA llamada a Gemini para ambos idiomas.
 */
async function sendAutocomplete(interaction, client, canalesValidos, roles, datos) {
  // Generar oraciones de ambos idiomas en UNA sola llamada
  const bilingual = await getBilingualSentences(SENTENCE_COUNT);
  let enviados = 0;
  const envios = [];

  for (const [idioma, canalId] of canalesValidos) {
    const canal = client.channels.cache.get(canalId.trim());
    if (!canal) continue;

    const sentences = bilingual[idioma]; // 'english' o 'spanish'
    const envio = await sendToChannel(canal, idioma, sentences, roles, client);
    envios.push(envio);
    enviados++;
  }

  if (enviados === 0) {
    return await interaction.editReply('⚠️ No se pudo enviar a ningún canal. Revisa los IDs en `src/config/eotd.js`.');
  }

  const historyEntry = {
    date: new Date().toISOString().slice(0, 10),
    mode: 'autocomplete',
    revealed: false,
    envios,
  };

  return { historyEntry, enviados, mensaje: `✅ Autocomplete enviado a ${enviados} canal(es).` };
}

/**
 * Envía ejercicios de autocomplete desde la API (sin interaction).
 * UNA SOLA llamada a Gemini para ambos idiomas.
 */
async function sendAutocompleteFromAPI(client, canalesValidos, roles, datos) {
  const bilingual = await getBilingualSentences(SENTENCE_COUNT);
  const envios = [];

  for (const [idioma, canalId] of canalesValidos) {
    const canal = client.channels.cache.get(canalId.trim());
    if (!canal) continue;

    const sentences = bilingual[idioma];
    const envio = await sendToChannel(canal, idioma, sentences, roles, client);
    envios.push(envio);
  }

  const historyEntry = {
    date: new Date().toISOString().slice(0, 10),
    mode: 'autocomplete',
    revealed: false,
    envios,
  };

  return { historyEntry, enviados: envios.length };
}

/**
 * Revela las respuestas de un ejercicio de autocomplete del día anterior.
 * @param {import('discord.js').Client} client
 * @param {Object} historyEntry - La entrada del history del día anterior
 * @returns {Promise<boolean>} - true si se reveló correctamente
 */
async function revealAnswers(client, historyEntry) {
  if (historyEntry.mode !== 'autocomplete' || historyEntry.revealed) {
    return false;
  }

  let anyRevealed = false;

  for (const envio of historyEntry.envios) {
    try {
      const canal = client.channels.cache.get(envio.channelId);
      if (!canal) continue;

      // Fetch del primer mensaje del ejercicio
      const firstMessage = await canal.messages.fetch(envio.firstMessageId).catch(() => null);
      if (!firstMessage) continue;

      // Construir resumen de respuestas
      const lines = envio.sentences.map((s, i) => {
        const blankMark = s.sentence.includes('___')
          ? s.sentence.replace('___', `**${s.answer}**`)
          : `${s.sentence} → **${s.answer}**`;
        return `${i + 1}. ${blankMark} ✅`;
      });

      const embed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle(envio.channelName === 'spanish'
          ? '📊 Respuestas de ayer — Autocomplete'
          : '📊 Yesterday\'s Answers — Autocomplete')
        .setDescription(lines.join('\n'))
        .setFooter({ text: envio.channelName === 'spanish'
          ? '¡Sigue practicando!'
          : 'Keep practicing!' })
        .setTimestamp();

      await firstMessage.reply({ embeds: [embed] });
      anyRevealed = true;

      // Limpiar cache para estos mensajes
      if (client.autocompleteCache && Array.isArray(envio.messageIds)) {
        for (const msgId of envio.messageIds) {
          client.autocompleteCache.delete(msgId);
        }
      }
    } catch (err) {
      console.error(`[Autocomplete Reveal] Error en canal ${envio.channelName}:`, err.message);
    }
  }

  // Marcar como revelado en el history (se persiste al guardar)
  historyEntry.revealed = true;

  return anyRevealed;
}

module.exports = {
  sendAutocomplete,
  sendAutocompleteFromAPI,
  revealAnswers,
  getBilingualSentences,
};
