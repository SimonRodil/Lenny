// src/modules/automod/suspiciousAccounts.js
const { EmbedBuilder, UserFlags } = require('discord.js');
const config = require('../../../config');

// ── Sistema de puntuación ──────────────────────────
// Basado en patrones reales de baneos del servidor.
// Si la puntuación total >= ALERT_THRESHOLD, se envía alerta.
const ALERT_THRESHOLD = 3;

function scoreAccount(member) {
  const user  = member.user;
  const now   = Date.now();
  const score = [];

  // ── Flags oficiales de Discord (prioridad máxima) ─
  if (user.flags?.has(UserFlags.Spammer)) {
    score.push({ pts: 10, reason: '🚨 **Discord detectó actividad de spam** en esta cuenta' });
  }
  if (user.flags?.has(UserFlags.Quarantined)) {
    score.push({ pts: 10, reason: '🔒 **Cuenta en cuarentena** por Discord' });
  }

  // ── Edad de la cuenta ──────────────────────────────
  const ageDays = (now - user.createdTimestamp) / (1000 * 60 * 60 * 24);
  if (ageDays < 3) {
    score.push({ pts: 4, reason: `⚠️ Cuenta creada hace **${Math.floor(ageDays)} días**` });
  } else if (ageDays < 14) {
    score.push({ pts: 2, reason: `⚠️ Cuenta creada hace **${Math.floor(ageDays)} días**` });
  }

  // ── Sin avatar ─────────────────────────────────────
  if (!user.avatar) {
    score.push({ pts: 1, reason: '⚠️ Sin avatar personalizado' });
  }

  // ── Patrones de username (de tus baneos reales) ────
  const name = user.username.toLowerCase();

  // nombre_números o nombre+números (taylorjohnsond595, timon00155, danyopen_40305)
  if (/^[a-z]+[\._]?\d{4,}$/.test(name)) {
    score.push({ pts: 2, reason: `⚠️ Username con patrón sospechoso (\`${user.username}\`)` });
  }

  // nombre+apellido+números (adamcampbell0323, taylorjohnsond595)
  if (/^[a-z]{4,}[a-z]{3,}\d{2,}$/.test(name)) {
    score.push({ pts: 2, reason: `⚠️ Username tipo "nombre+apellido+número"` });
  }

  // palabra "official", "open", "real", "admin", "support", "nitro", "free"
  if (/official|open_|real_|nitro|free|support|admin/.test(name)) {
    score.push({ pts: 3, reason: `⚠️ Username contiene palabra sospechosa (\`${user.username}\`)` });
  }

  return score;
}

/**
 * Evalúa al miembro al unirse y envía alerta si supera el umbral.
 * Solo alerta — no banea, no expulsa. Los mods deciden.
 */
async function checkSuspiciousAccount(member) {
  const score   = scoreAccount(member);
  const total   = score.reduce((sum, s) => sum + s.pts, 0);

  if (total < ALERT_THRESHOLD) return; // no sospechoso

  const logChannel = member.guild.channels.cache.get(config.channels.logs);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setColor(total >= 10 ? 0xED4245 : 0xFEE75C) // rojo si crítico, amarillo si sospechoso
    .setTitle(total >= 10 ? '🚨 Cuenta de alto riesgo' : '⚠️ Cuenta sospechosa')
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .addFields(
      { name: 'Usuario',        value: `${member} (${member.user.tag})`, inline: true },
      { name: 'ID',             value: member.user.id,                   inline: true },
      { name: 'Cuenta creada',  value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
      { name: `Señales detectadas — puntuación: ${total}`, value: score.map(s => s.reason).join('\n') }
    )
    .setTimestamp()
    .setFooter({ text: 'Lenny • Suspicious Accounts' });

  await logChannel.send({ embeds: [embed] });
}

module.exports = { checkSuspiciousAccount };