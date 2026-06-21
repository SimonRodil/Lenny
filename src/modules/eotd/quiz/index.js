const { EmbedBuilder } = require('discord.js');
const fallbackWords = require('./fallback');

const RANDOM_WORD_API = 'https://random-word-api.herokuapp.com/word?number=5';
const DICTIONARY_API = 'https://api.dictionaryapi.dev/api/v2/entries/en';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getFallbackQuiz() {
  const shuffled = shuffle(fallbackWords);
  const correct = shuffled[0];
  const distractors = shuffled.slice(1, 4);
  const answers = shuffle([
    { text: correct.definition, correct: true },
    ...distractors.map(d => ({ text: d.definition, correct: false })),
  ]);
  const correctIndex = answers.findIndex(a => a.correct);
  return { word: correct.word, phonetic: correct.phonetic, answers, correctIndex };
}

async function fetchWordsFromAPI() {
  const res = await fetch(RANDOM_WORD_API);
  if (!res.ok) throw new Error('Random word API error');
  return res.json();
}

async function fetchDefinition(word) {
  const res = await fetch(`${DICTIONARY_API}/${word}`);
  if (!res.ok) return null;
  const data = await res.json();
  const entry = data[0];
  if (!entry) return null;
  const meaning = entry.meanings?.[0]?.definitions?.[0];
  if (!meaning) return null;
  return {
    word: entry.word,
    definition: meaning.definition,
    phonetic: entry.phonetic || entry.phonetics?.find(p => p.text)?.text || '',
    example: meaning.example || null,
  };
}

async function generateQuizData() {
  try {
    const words = await fetchWordsFromAPI();
    if (!Array.isArray(words) || words.length < 5) throw new Error('Not enough words');

    const entries = (await Promise.all(words.map(w => fetchDefinition(w).catch(() => null))))
      .filter(Boolean);

    if (entries.length < 4) throw new Error('Not enough definitions');

    const shuffled = shuffle(entries);
    const correct = shuffled[0];
    const distractors = shuffled.slice(1, 4);

    const answers = shuffle([
      { text: correct.definition.replace(/[;:].*$/, '').trim(), correct: true },
      ...distractors.map(d => ({
        text: d.definition.replace(/[;:].*$/, '').trim(),
        correct: false,
      })),
    ]);

    const correctIndex = answers.findIndex(a => a.correct);

    return {
      word: correct.word,
      phonetic: correct.phonetic,
      definition: correct.definition,
      example: correct.example,
      answers: answers.map(a => ({ text: a.text })),
      correctIndex,
    };
  } catch (err) {
    console.error('[EOTD Quiz] API error, using fallback:', err.message);
    return getFallbackQuiz();
  }
}

const MENSAJES = {
  spanish: {
    titulo: (word) => `🌍 **Exercise of the Day — Quiz: "${word}"**`,
    instruccion: 'What does this word mean? Try to guess the correct definition!',
    instruccionIt: '*¿Qué significa esta palabra? ¡Intenta adivinar la definición correcta!*',
    ejemplo: (word, example) => example
      ? `📖 **Example:**\n"${example}"`
      : '',
    footer: '🔍 El resultado se revelará al votar',
  },
  english: {
    titulo: (word) => `🌍 **Ejercicio del Día — Quiz: "${word}"**`,
    instruccion: '¿Qué significa esta palabra? ¡Intenta adivinar la definición correcta!',
    instruccionIt: '*What does this word mean? Try to guess the correct definition!*',
    ejemplo: (word, example) => example
      ? `📖 **Ejemplo:**\n"${example}"`
      : '',
    footer: '🔍 El resultado se revelará al votar',
  },
};

async function sendQuiz(interaction, client, canalesValidos, roles, datos) {
  const quizData = await generateQuizData();
  const word = quizData.word;
  const phonetic = quizData.phonetic;
  const definition = quizData.definition;
  const example = quizData.example;
  const answers = quizData.answers;

  let enviados = 0;
  const envios = [];

  for (const [idioma, canalId] of canalesValidos) {
    const canal = client.channels.cache.get(canalId.trim());
    if (!canal) continue;

    const msg = MENSAJES[idioma];
    const rolId = roles[idioma];
    const contenido = /^\d{17,20}$/.test((rolId || '').trim()) ? `<@&${rolId.trim()}>` : undefined;

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(msg.titulo(word))
      .setDescription([
        phonetic ? `**${phonetic}**` : '',
        '',
        msg.instruccion,
        msg.instruccionIt,
        '',
        msg.ejemplo(word, example),
      ].filter(Boolean).join('\n'))
      .setTimestamp();

    const sent = await canal.send({
      content: contenido,
      embeds: [embed],
      poll: {
        question: { text: `❓ ¿Qué significa "${word}"?` },
        answers,
        duration: 24,
        layoutType: 2,
      },
    });

    envios.push({
      channelId: canal.id,
      channelName: idioma,
      messageId: sent.id,
      word,
      definition,
      timestamp: new Date().toISOString(),
    });
    enviados++;
  }

  if (enviados === 0) {
    return await interaction.editReply('⚠️ No se pudo enviar a ningún canal. Revisa los IDs en `src/config/eotd.js`.');
  }

  const historyEntry = {
    date: new Date().toISOString().slice(0, 10),
    mode: 'quiz',
    word,
    phonetic,
    definition,
    correctIndex: quizData.correctIndex,
    envios,
  };

  return { historyEntry, enviados, mensaje: `✅ Quiz enviado ("${word}") a ${enviados} canal(es).` };
}

async function sendQuizFromAPI(client, canalesValidos, roles, datos) {
  const quizData = await generateQuizData();
  const word = quizData.word;
  const phonetic = quizData.phonetic;
  const definition = quizData.definition;
  const example = quizData.example;
  const answers = quizData.answers;

  const envios = [];

  for (const [idioma, canalId] of canalesValidos) {
    const canal = client.channels.cache.get(canalId.trim());
    if (!canal) continue;

    const msg = MENSAJES[idioma];
    const rolId = roles[idioma];
    const contenido = /^\d{17,20}$/.test((rolId || '').trim()) ? `<@&${rolId.trim()}>` : undefined;

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(msg.titulo(word))
      .setDescription([
        phonetic ? `**${phonetic}**` : '',
        '',
        msg.instruccion,
        msg.instruccionIt,
        '',
        msg.ejemplo(word, example),
      ].filter(Boolean).join('\n'))
      .setTimestamp();

    const sent = await canal.send({
      content: contenido,
      embeds: [embed],
      poll: {
        question: { text: `❓ ¿Qué significa "${word}"?` },
        answers,
        duration: 24,
        layoutType: 2,
      },
    });

    envios.push({
      channelId: canal.id,
      channelName: idioma,
      messageId: sent.id,
      word,
      definition,
      timestamp: new Date().toISOString(),
    });
  }

  const historyEntry = {
    date: new Date().toISOString().slice(0, 10),
    mode: 'quiz',
    word,
    phonetic,
    definition,
    correctIndex: quizData.correctIndex,
    envios,
  };

  return { historyEntry, enviados: envios.length };
}

module.exports = { sendQuiz, sendQuizFromAPI, generateQuizData };
