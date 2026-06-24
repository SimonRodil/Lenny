const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');

class LennyClient extends Client {
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
      ],
      partials: [
        Partials.Message,
        Partials.Channel,
      ],
    });

    // Aquí vivirán todos tus comandos, cargados dinámicamente más adelante
    this.commands = new Collection();

    // Para manejar cooldowns por usuario/comando
    this.cooldowns = new Collection();

    // Contador de usos de comandos para las estadísticas
    this.commandCounts = new Map();

    // Contador de mensajes por canal para las estadísticas
    this.messageCounts = new Map();
  }
}

module.exports = LennyClient;