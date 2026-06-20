// src/events/messageCreate.js
const { checkMessage } = require('../modules/automod');

module.exports = {
  name: 'messageCreate',
  once: false,
  async execute(message, client) {
    if (message.author.bot) return;

    // Asegura que el member esté en caché antes del automod (para que la exención por roles funcione)
    if (message.guild && !message.member) {
      await message.guild.members.fetch(message.author.id).catch(() => {});
    }

    // Cuenta mensajes por canal para estadísticas
    const channelId = message.channel.id;
    client.messageCounts.set(channelId, (client.messageCounts.get(channelId) ?? 0) + 1);

    // AutoMod — si elimina el mensaje, no procesa más
    const blocked = await checkMessage(message);
    if (blocked) return;

    // Aquí irán otros módulos que reaccionen a mensajes,
    // como el sistema de niveles (XP por mensajes)
  },
};