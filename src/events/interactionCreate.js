module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
      client.commandCounts.set(
        interaction.commandName,
        (client.commandCounts.get(interaction.commandName) || 0) + 1
      );
    } catch (err) {
      console.error(`[ERROR] /${interaction.commandName}:`, err);
      const msg = { content: '❌ Algo salió mal.', flags: 64 }; // 64 = ephemeral
      interaction.replied || interaction.deferred
        ? interaction.followUp(msg)
        : interaction.reply(msg);
    }
  },
};