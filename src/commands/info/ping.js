// src/commands/info/ping.js
const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Muestra la latencia de Lenny'),

  async execute(interaction, client) {
    const latency = Date.now() - interaction.createdTimestamp;
    const apiPing = Math.round(client.ws.ping);

    const embed = createEmbed()
      .setTitle('🏓 Pong!')
      .addFields(
        { name: 'Latencia', value: `${latency}ms`, inline: true },
        { name: 'API', value: `${apiPing}ms`, inline: true }
      );

    await interaction.reply({ embeds: [embed] });
  },
};