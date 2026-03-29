// src/modules/automod/index.js
const { logMessageDelete } = require('../logger');
const config = require('../../../config');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// ── Configuración del automod ──────────────────────
const AUTOMOD_CONFIG = {
  // Palabras prohibidas (en minúsculas)
  bannedWords: [
    // ── Slurs raciales ──────────────────────────────
    'nigger', 'nigga', 'n1gger', 'n1gga', 'ni**er',
    'spic', 'sp1c', 'chink', 'ch1nk', 'gook',
    'wetback', 'beaner', 'kike', 'k1ke', 'zipperhead',
    'towelhead', 'sandnigger', 'coon', 'jigaboo', 'porch monkey',
    'cracker',

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

// 🆕 Palabras sospechosas: solo alerta silenciosa a mods, nunca borra el mensaje
suspiciousWords: {
  words: [
  // ── Ofertas laborales / trabajo remoto (ES) ────────────
  'trabajo desde casa', 'gana dinero', 'ingresos extra',
  'trabaja con nosotros', 'únete a nuestro equipo',
  'gana dinero fácil', 'dinero rápido', 'ganar desde casa',
  'oportunidad de negocio', 'negocio rentable',
  'inversión garantizada', 'sin experiencia previa',
  'flexibilidad horaria', 'solo necesitas un teléfono',
  'trabaja a tu ritmo', 'horario flexible',
  'gana desde tu celular', 'genera ingresos pasivos',
  'emprendimiento desde casa', 'modelo de negocio probado',
  'sin jefe', 'sé tu propio jefe', 'libertad financiera',

  // ── Work from home / job offers (EN) ──────────────────
  'work from home', 'make money online', 'earn extra income',
  'join our team', 'work with us',
  'easy money', 'fast money', 'earn from home',
  'business opportunity', 'profitable business',
  'guaranteed investment', 'no experience needed',
  'flexible hours', 'all you need is a phone',
  'work at your own pace', 'be your own boss',
  'passive income', 'financial freedom',
  'proven business model', 'work anywhere', 'job opportunity',

  // ── Crypto / estafas financieras (ES) ─────────────────
  'duplica tu dinero', 'inversión segura', 'retorno garantizado',
  'crypto signals', 'señales crypto', 'pump group',
  'multiplica tus ganancias', 'gana con cripto',
  'trading automatizado', 'bot de trading',
  'plataforma de inversión', 'rentabilidad garantizada',
  'retiro en 24 horas', 'sin riesgo',

  // ── Crypto / financial scams (EN) ─────────────────────
  'double your money', 'safe investment', 'guaranteed returns',
  'crypto tips', 'pump and dump', 'trading signals',
  'multiply your earnings', 'earn with crypto',
  'automated trading', 'trading bot',
  'investment platform', 'guaranteed profit',
  'withdraw in 24 hours', 'zero risk', 'risk free',
  '100% profit', 'daily returns',

  // ── Phishing / urgencia artificial (ES) ───────────────
  'haz clic aquí', 'regístrate gratis', 'accede ahora',
  'oferta limitada', 'solo hoy', 'actúa ya',
  'últimas plazas', 'no pierdas esta oportunidad',
  'tiempo limitado', 'enlace exclusivo',
  'código de invitación', 'acceso exclusivo',

  // ── Phishing / urgency (EN) ───────────────────────────
  'click here', 'sign up for free', 'access now',
  'limited offer', 'today only', 'act now',
  'limited spots', 'don\'t miss this opportunity',
  'limited time', 'exclusive link',
  'invitation code', 'exclusive access',
  'dm me', 'message me for details', 'check my bio',
  'link in bio', 'drop your email',
],
  thresholds: {
    low:    1,  // 🟡 amarillo, sin ping
    medium: 2,  // 🟠 naranja, sin ping
    high:   3,  // 🔴 rojo, ping @team
  },
},

  // Anti-spam: máx mensajes por ventana de tiempo
  spam: {
    maxMessages: 4,    // mensajes
    timeWindow:  120000, // milisegundos (60 segundos)
  },

  // Anti cross-channel spam: mismo mensaje en varios canales
  crossChannelSpam: {
    maxChannels:  4,      // cuántos canales distintos antes de actuar
    timeWindow:   120000,  // milisegundos (120 segundos)
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

// ── Pre-compilar regex de palabras sospechosas al arrancar ──
// Igual que BANNED_REGEX pero para términos de alerta suave.
// Se hace una sola vez para no recompilar en cada mensaje.
const SUSPICIOUS_REGEX = AUTOMOD_CONFIG.suspiciousWords.words.map(word => ({
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

  // Establecemos a las suspicious words de ultimo ya que primero nos aseguramos de que no pase por spam.
  await checkSuspiciousWords(message);

  if (AUTOMOD_CONFIG.blockLinks && await checkLinks(message)) return true;

  return false;
}

// ── Detección de palabras sospechosas ──────────────────────
// A diferencia de checkBannedWords, esta función NO borra el mensaje
// ni avisa al usuario. Solo envía una alerta silenciosa a los mods.
// ── Palabras sospechosas (solo alerta, no borra) ───
async function checkSuspiciousWords(message) {
  const content = message.content.toLowerCase();

  // Recorre TODOS los patrones y acumula los que hacen match (únicos)
  const matches = SUSPICIOUS_REGEX
    .filter(({ regex }) => regex.test(content))
    .map(({ word }) => word);

  if (matches.length === 0) return;

  const { thresholds } = AUTOMOD_CONFIG.suspiciousWords;
  const count = matches.length;

  // Determina el nivel de amenaza
  let level, emoji, color, pingTeam;

  if (count >= thresholds.high) {
    level    = 'ALTO';
    emoji    = '🚨';
    color    = config.colors.error;       // rojo
    pingTeam = true;
  } else if (count >= thresholds.medium) {
    level    = 'MEDIO';
    emoji    = '🔶';
    color    = 0xFFA500;                  // naranja
    pingTeam = false;
  } else {
    level    = 'BAJO';
    emoji    = '⚠️';
    color    = config.colors.warning;     // amarillo
    pingTeam = false;
  }

  const logsSpam = message.guild.channels.cache.get(config.channels.logsSpam);
  if (!logsSpam) return;

  // El mensaje citado (máx 800 chars para no saturar el embed)
  const cited = message.content.length > 800
    ? message.content.slice(0, 800) + '…'
    : message.content;

    const components = [];

    // 🆕 Solo en nivel ALTO se añade el botón de ban
    if (pingTeam) {
      components.push(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`suspect_ban_${message.author.id}`)
            .setLabel('Banear')
            .setEmoji('🔨')
            .setStyle(ButtonStyle.Danger),
        )
      );
    }

  await logsSpam.send({
    content: pingTeam ? `<@&${config.roles.team}>` : undefined,
    embeds: [{
      color,
      title: `${emoji} Mensaje sospechoso — Nivel ${level}`,
      fields: [
        {
          name: 'Usuario',
          value: `${message.author.tag} (<@${message.author.id}>)`,
          inline: true,
        },
        {
          name: 'Canal',
          value: `<#${message.channelId}>`,
          inline: true,
        },
        {
          name: `Coincidencias (${count})`,
          value: matches.map(w => `\`${w}\``).join(', '),
        },
        {
          name: 'Mensaje',
          value: `\`\`\`${cited}\`\`\``,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: `ID: ${message.author.id} · El mensaje NO fue eliminado` },
    }],
    components,  // 🆕 vacío en bajo/medio, con botón en alto
  });
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

    // ── Timeout específico para spam ──
    try {
      if (message.member) {
        await message.member.timeout(
          10 * 60 * 1000,
          '[AutoMod] Spam detectado'
        );
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`spam_ban_${message.author.id}`)
          .setLabel('Banear')
          .setEmoji('🔨')
          .setStyle(ButtonStyle.Danger),   // rojo

        new ButtonBuilder()
          .setCustomId(`spam_redeem_${message.author.id}`)
          .setLabel('Redimir')
          .setEmoji('🕊️')
          .setStyle(ButtonStyle.Success),  // verde
      );

      // Notifica a los mods
      const logsSpam = message.guild.channels.cache.get(config.channels.logsSpam);
      if (logsSpam) {
        await logsSpam.send({
          content: `<@&${config.roles.team}>`,
          embeds: [{
            color: config.colors.error,
            title: '⏱️ Timeout por spam — AutoMod',
            fields: [
              { name: 'Usuario',  value: `${message.author.tag} (<@${message.author.id}>)`, inline: true },
              { name: 'Canal',    value: `<#${message.channelId}>`,                          inline: true },
              { name: 'Duración', value: '1 mes',                                       inline: true },
            ],
            timestamp: new Date().toISOString(),
            footer: { text: `ID: ${message.author.id}` },
          }],
          components: [row],
        });
      } else { console.error ('No consiguió el canal de spam-messages-alert') }
    } catch (err) {
      console.error('[AutoMod] Error al aplicar timeout por spam:', err.message);
    }
    // ─────────────────────────────────

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

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`spam_ban_${message.author.id}`)
      .setLabel('Banear')
      .setEmoji('🔨')
      .setStyle(ButtonStyle.Danger),   // rojo

    new ButtonBuilder()
      .setCustomId(`spam_redeem_${message.author.id}`)
      .setLabel('Redimir')
      .setEmoji('🕊️')
      .setStyle(ButtonStyle.Success),  // verde
  );

  // Notifica a los mods
  const logsSpam = message.guild.channels.cache.get(config.channels.logsSpam);
  if (logsSpam) {
    await logsSpam.send({
      content: `<@&${config.roles.team}> 🚨 Cross-channel spam detectado de ${message.author} en ${uniqueChannels.size} canales.`,
      embeds: [{
        color: config.colors.error,
        title: '⏱️ Timeout por spam — AutoMod',
        fields: [
          { name: 'Usuario',  value: `${message.author.tag} (<@${message.author.id}>)`, inline: true },
          { name: 'Canal',    value: `<#${message.channelId}>`,                          inline: true },
          { name: 'Duración', value: '1 mes',                                       inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: `ID: ${message.author.id}` },
      }],
      components: [row],
    });
  } else { console.error ('No consiguió el canal de spam-messages-alert') }

  /* const logChannel = message.guild.channels.cache.get(config.channels.logs);
  if (logChannel) {
    await logChannel.send(`<@&${config.roles.team}> 🚨 Cross-channel spam detectado de ${message.author} en ${uniqueChannels.size} canales.`);
  } */

  return true;
}

module.exports = { checkMessage };