const { infoEmbed } = require('../../../utils/embed');
const config = require('../../../config');

/**
 * Envía un mensaje de bienvenida al canal configurado.
 * @param {GuildMember} member
 */
async function handleWelcome(member) {
  const { guild } = member;

  // Busca el canal de bienvenida desde config
  const channel = guild.channels.cache.get(config.channels.welcome)
    ?? guild.systemChannel; // fallback al canal del sistema

  if (!channel) return; // Si no hay canal configurado, no hace nada

  const embed = infoEmbed(
    `¡Bienvenido/a, ${member.user.username}! 👋`,
    `Hola ${member}, bienvenido/a a **${guild.name}**.\nEres el miembro número **${guild.memberCount}**.\n\nLee las reglas y disfruta la estadía. 🎉`
  )
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .setFooter({ text: `ID: ${member.user.id}` });

  await channel.send({ embeds: [embed] });
}

module.exports = { handleWelcome };