const { Client, GatewayIntentBits, Collection } = require('discord.js');

class LennyClient extends Client {
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
      ],
    });

    // Aquí vivirán todos tus comandos, cargados dinámicamente más adelante
    this.commands = new Collection();

    // Para manejar cooldowns por usuario/comando
    this.cooldowns = new Collection();

    // Contador de usos de comandos para las estadísticas
    this.commandCounts = new Map();
  }
}

module.exports = LennyClient;