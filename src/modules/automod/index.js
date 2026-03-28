const { logMessageDelete } = require('../logger');


// ── Configuración del automod ──────────────────────
const AUTOMOD_CONFIG = {
  // Palabras prohibidas (en minúsculas)
  bannedWords: [
    // ── Slurs raciales ──────────────────────────────
    'nigger', 'nigga', 'n1gger', 'n1gga', 'ni**er',
    'spic', 'sp1c', 'chink', 'ch1nk', 'gook',
    'wetback', 'beaner', 'kike', 'k1ke', 'zipperhead',
    'towelhead', 'sandnigger', 'coon', 'jigaboo', 'porch monkey',

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
  exemptRoles: [], // añade IDs de roles de admin/mod
};


// ── Pre-compilar regex una sola vez al arrancar ───
// (aquí va, justo DEBAJO de AUTOMOD_CONFIG)
const BANNED_REGEX = AUTOMOD_CONFIG.bannedWords.map(word => ({
  word,
  regex: new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'),
}));

// Mapa en memoria para tracking de spam: userId → [timestamps]
const spamTracker = new Map();


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


module.exports = { checkMessage };