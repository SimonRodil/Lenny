// src/events/messageCreate.js
const { checkMessage } = require('../modules/automod');

module.exports = {
  name: 'messageCreate',
  once: false,
  async execute(message, client) {
    if (message.author.bot) return;

    // AutoMod — si elimina el mensaje, no procesa más
    const blocked = await checkMessage(message);
    if (blocked) return;

    // Aquí irán otros módulos que reaccionen a mensajes,
    // como el sistema de niveles (XP por mensajes)
  },
};