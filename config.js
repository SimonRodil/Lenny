// config.js
module.exports = {
  // Identidad del bot
  name: 'Lenny',
  prefix: '!', // por si en algún momento quieres comandos de prefijo también

  // Colores de embeds (hex) — la paleta visual de Lenny
  colors: {
    primary:  0x5865F2, // blurple de Discord
    success:  0x57F287,
    warning:  0xFEE75C,
    error:    0xED4245,
    neutral:  0x2B2D31,
  },

  // Emojis que Lenny usa en sus mensajes
  emojis: {
    success: '✅',
    error:   '❌',
    warning: '⚠️',
    loading: '⏳',
    info:    'ℹ️',
  },

  // Cooldown por defecto en segundos para comandos
  defaultCooldown: 3,

  // IDs de roles importantes (rellena con los de tu servidor)
  roles: {
    admin:    '',
    mod:      '',
    verified: '',
  },

  // IDs de canales importantes
  channels: {
    welcome: '913891814233227294', // ID del canal de welcome
    logs:     '1487382936301863044', // ID del canal de los logs para lenny.
    general:  '1487383073199751260',
  },
};