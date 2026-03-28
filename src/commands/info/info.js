const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')           // ← mismo nombre del comando
    .setDescription('Pong!'),

  async execute(interaction, client) {
    await interaction.reply('🏓 Pong!');
  },
};