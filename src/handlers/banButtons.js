// src/handlers/banButtons.js
const config = require('../../config');

module.exports = (client) => {
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    if (
      !interaction.customId.startsWith('spam_ban_') &&
      !interaction.customId.startsWith('spam_redeem_') &&
      !interaction.customId.startsWith('suspect_ban_')
    ) return;

    const { customId, guild, member } = interaction;

    const hasPermission =
      member.roles.cache.has(config.roles.mod) ||
      member.roles.cache.has(config.roles.modSenior) ||
      member.roles.cache.has(config.roles.admin);

    if (!hasPermission) {
      return interaction.reply({
        content: `${config.emojis.error} No tienes permisos para usar este botón.`,
        ephemeral: true,
      });
    }

    // ── Botón de baneo ──────────────────────────────
    if (customId.startsWith('spam_ban_') || customId.startsWith('suspect_ban_')) {
      const userId = customId.replace('spam_ban_', '').replace('suspect_ban_', '');
      try {
        await guild.members.ban(userId, {
          reason: `[AutoMod] Spam — baneado por ${member.user.tag}`,
        });

        // 1. Quita los botones del mensaje original (embed intacto)
        await interaction.update({ components: [] });

        // 2. Envía mensaje de confirmación debajo
        await interaction.followUp({
          embeds: [{
            color: config.colors.error,
            title: '🔨 Usuario baneado',
            description: `<@${userId}> fue baneado por **${member.user.tag}**.`,
            timestamp: new Date().toISOString(),
          }],
        });
      } catch (err) {
        await interaction.reply({
          content: `${config.emojis.error} Error al banear: \`${err.message}\``,
          ephemeral: true,
        });
      }
    }

    // ── Botón de redimir ────────────────────────────
    if (customId.startsWith('spam_redeem_')) {
      const userId = customId.replace('spam_redeem_', '');
      try {
        const target = await guild.members.fetch(userId);
        await target.timeout(null, `[AutoMod] Timeout retirado por ${member.user.tag}`);

        // 1. Quita los botones del mensaje original (embed intacto)
        await interaction.update({ components: [] });

        // 2. Envía mensaje de confirmación debajo
        await interaction.followUp({
          embeds: [{
            color: config.colors.success,
            title: '🕊️ Usuario redimido',
            description: `<@${userId}> fue perdonado por **${member.user.tag}**. Timeout eliminado.`,
            timestamp: new Date().toISOString(),
          }],
        });
      } catch (err) {
        await interaction.reply({
          content: `${config.emojis.error} Error al redimir: \`${err.message}\``,
          ephemeral: true,
        });
      }
    }
  });
};