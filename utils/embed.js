// utils/embed.js
const { EmbedBuilder } = require('discord.js');
const config = require('../config');

/**
 * Crea un embed base con el estilo de Lenny.
 * Todos los comandos deben usar esto en vez de crear EmbedBuilder directo.
 */
function createEmbed(type = 'primary') {
  return new EmbedBuilder()
    .setColor(config.colors[type] ?? config.colors.primary)
    .setTimestamp()
    .setFooter({ text: config.name });
}

/**
 * Embed de éxito
 */
function successEmbed(description) {
  return createEmbed('success')
    .setDescription(`${config.emojis.success} ${description}`);
}

/**
 * Embed de error
 */
function errorEmbed(description) {
  return createEmbed('error')
    .setDescription(`${config.emojis.error} ${description}`);
}

/**
 * Embed de información
 */
function infoEmbed(title, description) {
  return createEmbed('primary')
    .setTitle(title)
    .setDescription(description);
}

module.exports = { createEmbed, successEmbed, errorEmbed, infoEmbed };