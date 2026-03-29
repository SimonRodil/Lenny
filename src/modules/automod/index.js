// src/modules/automod/index.js
const { logMessageDelete } = require('../logger');
const config = require('../../../config');

// ── Configuración del automod ──────────────────────
const AUTOMOD_CONFIG = {
  // Palabras prohibidas (en minúsculas)
  bannedWords: [
    // ── Slurs raciales ──────────────────────────────
    'nigger', 'nigga', 'n1gger', 'n1gga', 'ni**er',
    'spic', 'sp1c', 'chink', 'ch1nk', 'gook',
    'wetback', 'beaner', 'kike', 'k1ke', 'zipperhead',
    'towelhead', 'sandnigger', 'coon', 'jigaboo', 'porch monkey',
    'cacker',

    // ── Homofobia / transfobia ──────────────────────
    'faggot', 'f4ggot', 'fag', 'dyke', 'tranny',
    'shemale', 'ladyboy', 'queer', // ← ojo, algunas comunidades lo reivindican

    // ── Insultos generales severos ──────────────────
    'retard', 'ret4rd', 'retarded',

    // ── Amenazas / violencia ────────────────────────
    'kys', 'kill yourself', 'go kill yourself',
    'i will kill you', 'i will find you',

    // ── Contenido sexual explícito ──────────────────
    'childporn', 'child porn', 'pedophile',
    'lolicon', 'shotacon',

    // ── Spam / scam ─────────────────────────────────
    'discord.gg/', 'discord.com/invite',
    'free nitro', 'claim your nitro',
    'bit.ly', 'tinyurl', // links acortados sospechosos
  ], // añade las tuyas

  // Anti-spam: máx mensajes por ventana de tiempo
  spam: {
    maxMessages: 5,    // mensajes
    timeWindow:  5000, // milisegundos (5 segundos)
  },

  // Anti cross-channel spam: mismo mensaje en varios canales
  crossChannelSpam: {
    maxChannels:  3,      // cuántos canales distintos antes de actuar
    timeWindow:   10000,  // milisegundos (10 segundos)
    timeoutOnDetect: true, // true = timeout 28 días, false = solo borrar + alertar
  },

  // Anti-links: bloquear URLs externas
  // Cambia a true para activar. Los dominios de allowedDomains siempre pasan.
  blockLinks: true,

  // Dominios permitidos aunque blockLinks esté activo (whitelist)
  // Añade aquí cualquier dominio que quieras que no sea bloqueado.
  allowedDomains: [
    'youtube.com', 'youtu.be',
    'twitch.tv',
    'twitter.com', 'x.com',
    'imgur.com',
    'tenor.com', 'giphy.com', // gifs
    'spotify.com',
  ],

  // Roles exentos del automod (IDs)
  exemptRoles: [config.roles.team], // añade IDs de roles de admin/mod
};


// ── Pre-compilar regex una sola vez al arrancar ───
// (aquí va, justo DEBAJO de AUTOMOD_CONFIG)
const BANNED_REGEX = AUTOMOD_CONFIG.bannedWords.map(word => ({
  word,
  regex: new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'),
}));

// Mapa en memoria para tracking de spam: userId → [timestamps]
const spamTracker = new Map();

// Mapa para tracking de spam cross-canales: userId → [{ channelId, content, timestamp }]
const crossChannelTracker = new Map();


/**
 * Punto de entrada del automod.
 * Se llama desde el evento messageCreate.
 * @returns {boolean} true si el mensaje fue eliminado
 */
async function checkMessage(message) {
  if (message.author.bot) return false;
  if (!message.guild) return false;

  // Verifica si el autor tiene un rol exento
  const memberRoles = message.member?.roles.cache;
  const isExempt = AUTOMOD_CONFIG.exemptRoles.some(id => memberRoles?.has(id));
  if (isExempt) return false;

  // Corre todas las comprobaciones
  if (await checkBannedWords(message)) return true;
  if (await checkCrossChannelSpam(message)) return true;
  if (await checkSpam(message)) return true;
  if (AUTOMOD_CONFIG.blockLinks && await checkLinks(message)) return true;

  return false;
}


// ── Palabras prohibidas ────────────────────────────
async function checkBannedWords(message) {
  const content = message.content.toLowerCase();

  // Lee BANNED_REGEX con bordes de palabra para cada término
  const match = BANNED_REGEX.find(({ regex }) => regex.test(content));
  if (!match) return false;

  await punish(message, `contiene una palabra prohibida`);
  return true;
}


// ── Anti-spam ──────────────────────────────────────
async function checkSpam(message) {
  const userId = message.author.id;
  const now    = Date.now();
  const { maxMessages, timeWindow } = AUTOMOD_CONFIG.spam;

  // Obtiene o crea el historial del usuario
  if (!spamTracker.has(userId)) spamTracker.set(userId, []);
  const timestamps = spamTracker.get(userId);

  // Filtra mensajes dentro de la ventana de tiempo
  const recent = timestamps.filter(t => now - t < timeWindow);
  recent.push(now);
  spamTracker.set(userId, recent);

  if (recent.length >= maxMessages) {
    spamTracker.delete(userId); // resetea el contador
    await punish(message, 'está enviando mensajes demasiado rápido (spam)');
    return true;
  }

  return false;
}


// ── Anti-links ─────────────────────────────────────
// Bloquea URLs externas salvo las que estén en allowedDomains.
// Para desactivar completamente: blockLinks: false en AUTOMOD_CONFIG.
// Para añadir un dominio permitido: agrégalo a allowedDomains arriba.
async function checkLinks(message) {
  const urlRegex = /(https?:\/\/|www\.)([^\s/]+)/gi;
  let match;

  while ((match = urlRegex.exec(message.content)) !== null) {
    const domain = match[2].replace(/^www\./, '').toLowerCase();

    // Verifica si el dominio (o un subdominio) está en la whitelist
    const isAllowed = AUTOMOD_CONFIG.allowedDomains.some(
      d => domain === d || domain.endsWith('.' + d)
    );

    if (!isAllowed) {
      await punish(message, 'contiene un enlace no permitido');
      return true;
    }
  }

  return false;
}


// ── Acción: borrar + avisar + loggear ─────────────
async function punish(message, reason) {

  if (!message.guild || !message.channel) return; // mensaje parcial, ignorar
  
  try {
    // Borra el mensaje
    await message.delete();

    // Avisa al usuario con un mensaje en el canal
    const warning = await message.channel.send(
      `⚠️ ${message.author}, tu mensaje fue eliminado porque ${reason}.`
    );

    // Borra el aviso después de 5 segundos
    setTimeout(() => warning.delete().catch(() => {}), 5000);

    // Registra en logs
    await logMessageDelete({
      ...message,
      content: `[AUTOMOD: ${reason}] ${message.content}`,
    });

  } catch (err) {
    console.error('[AUTOMOD] Error al castigar:', err.message);
  }
}

// ── Anti cross-channel spam ────────────────────────
// Detecta si el mismo usuario envió el mismo texto en N canales distintos
// dentro de la ventana de tiempo configurada.
async function checkCrossChannelSpam(message) {
  const { maxChannels, timeWindow, timeoutOnDetect } = AUTOMOD_CONFIG.crossChannelSpam;
  const userId  = message.author.id;
  const content = message.content.trim().toLowerCase();
  const now     = Date.now();

  if (!crossChannelTracker.has(userId)) crossChannelTracker.set(userId, []);
  const history = crossChannelTracker.get(userId);

  // Limpia entradas antiguas
  const recent = history.filter(e => now - e.timestamp < timeWindow);

  // Añade entrada actual
  recent.push({ channelId: message.channel.id, content, timestamp: now });
  crossChannelTracker.set(userId, recent);

  // Filtra solo las entradas con el mismo contenido
  const sameContent = recent.filter(e => e.content === content);
  const uniqueChannels = new Set(sameContent.map(e => e.channelId));

  if (uniqueChannels.size < maxChannels) return false;

  // ── Acción ──────────────────────────────────────
  crossChannelTracker.delete(userId); // resetea

  // Borra todos los mensajes detectados (el actual + los anteriores si aún existen)
  for (const entry of sameContent) {
    const ch = message.guild.channels.cache.get(entry.channelId);
    if (!ch) continue;
    const msgs = await ch.messages.fetch({ limit: 20 }).catch(() => null);
    if (!msgs) continue;
    const target = msgs.find(m => m.author.id === userId && m.content.trim().toLowerCase() === content);
    if (target) await target.delete().catch(() => {});
  }

  // Le da un timeout al usuario por hacer spam
  if (timeoutOnDetect) {
    const member = message.guild.members.cache.get(userId)
      || await message.guild.members.fetch(userId).catch(() => null);

    if (member) {
      await member.timeout(
        28 * 24 * 60 * 60 * 1000,
        `[AUTOMOD] Cross-channel spam: mismo mensaje en ${uniqueChannels.size} canales`
      ).catch(err => console.error('[AUTOMOD] Error al aplicar timeout:', err.message));
    }
  }

  // Alerta al canal de logs con mención al equipo de mods
  await logMessageDelete({
    ...message,
    content: `[AUTOMOD: cross-channel spam en ${uniqueChannels.size} canales] ${message.content}`,
  });

  const logChannel = message.guild.channels.cache.get(config.channels.logs);
  if (logChannel) {
    await logChannel.send(`<@&${config.roles.team}> 🚨 Cross-channel spam detectado de ${message.author} en ${uniqueChannels.size} canales.`);
  }

  return true;
}

module.exports = { checkMessage };