const { EmbedBuilder } = require('discord.js');
const config = require('../../../config');

/**
 * Obtiene el canal de logs del servidor.
 * Retorna null si no está configurado.
 */
function getLogChannel(guild) {
  return guild.channels.cache.get(config.channels.logs) ?? null;
}

/**
 * Crea un embed base para logs con color y timestamp.
 */
function logEmbed(color, title) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setTimestamp();
}

// ── Entrada de miembro ─────────────────────────────
async function logMemberJoin(member) {
  const channel = getLogChannel(member.guild);
  if (!channel) return;

  const embed = logEmbed(config.colors.success, '📥 Miembro entró')
    .setThumbnail(member.user.displayAvatarURL())
    .addFields(
      { name: 'Usuario', value: `${member} (${member.user.tag})`, inline: true },
      { name: 'ID', value: member.user.id, inline: true },
      { name: 'Cuenta creada', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true }
    );

  await channel.send({ embeds: [embed] });
}

// ── Salida de miembro ──────────────────────────────
async function logMemberLeave(member) {
  const channel = getLogChannel(member.guild);
  if (!channel) return;

  const embed = logEmbed(config.colors.error, '📤 Miembro salió')
    .setThumbnail(member.user.displayAvatarURL())
    .addFields(
      { name: 'Usuario', value: `${member.user.tag}`, inline: true },
      { name: 'ID', value: member.user.id, inline: true },
      { name: 'Estuvo', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true }
    );

  await channel.send({ embeds: [embed] });
}

// ── Mensaje editado ────────────────────────────────
async function logMessageEdit(oldMessage, newMessage) {
  if (oldMessage.author?.bot) return;
  if (oldMessage.content === newMessage.content) return; // sin cambio real

  const channel = getLogChannel(oldMessage.guild);
  if (!channel) return;

  const embed = logEmbed(config.colors.warning, '✏️ Mensaje editado')
    .addFields(
      { name: 'Autor', value: `${oldMessage.author}`, inline: true },
      { name: 'Canal', value: `${oldMessage.channel}`, inline: true },
      { name: 'Antes', value: oldMessage.content?.slice(0, 1024) || '*vacío*' },
      { name: 'Después', value: newMessage.content?.slice(0, 1024) || '*vacío*' }
    )
    .setURL(newMessage.url);

  await channel.send({ embeds: [embed] });
}

// ── Mensaje borrado ────────────────────────────────
async function logMessageDelete(message) {
  if (message.author?.bot) return;

  const channel = getLogChannel(message.guild);
  if (!channel) return;

  const embed = logEmbed(config.colors.error, '🗑️ Mensaje borrado')
    .addFields(
      { name: 'Autor', value: `${message.author}`, inline: true },
      { name: 'Canal', value: `${message.channel}`, inline: true },
      { name: 'Contenido', value: message.content?.slice(0, 1024) || '*vacío o adjunto*' }
    );

  await channel.send({ embeds: [embed] });
}

module.exports = { logMemberJoin, logMemberLeave, logMessageEdit, logMessageDelete };