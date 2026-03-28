// src/modules/welcome.js
const { infoEmbed } = require('../../../utils/embed');
const config = require('../../../config');

async function handleWelcome(member) {
  if (!config.features.welcome) return; // ← si está desactivado, no hace nada

  const { guild } = member;

  const channel = guild.channels.cache.get(config.channels.welcome)
    ?? guild.systemChannel;

  if (!channel) return;

  const embed = infoEmbed(
    `¡Bienvenido/a, ${member.user.username}! 👋`,
    `Hola ${member}, bienvenido/a a **${guild.name}**.\nEres el miembro número **${guild.memberCount}**.\n\nLee las reglas y disfruta la estadía. 🎉`
  )
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .setFooter({ text: `ID: ${member.user.id}` });

  await channel.send({ embeds: [embed] });
}

module.exports = { handleWelcome };