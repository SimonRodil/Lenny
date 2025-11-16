module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    // Solo responder a comandos slash
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error('Error executing command:', error);
      await interaction.reply({ content: 'Ocurrió un error al ejecutar el comando.', ephemeral: true });
    }
  }
};
