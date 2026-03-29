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

  // Módulos activos/inactivos
  features: {
    welcome: false, // ← ponlo en true para reactivar
  },

  // IDs de roles importantes (rellena con los de tu servidor)
  roles: {
    admin:    '',
    modSenior:'',
    mod:      '',
    team:     '',
    verified: '',
  },

  // IDs de canales importantes
  channels: {
    logs:         '',  // canal general (puedes dejarlo o quitarlo)
    welcome:      '',  // bienvenida (la desactivamos, pero dejamos la key)
    logsSuspect:  '',  // alertas de cuentas sospechosas
    logsSpam:     '',  // alertas de spam
    logsLinks:    '',  // alertas de links
    general:      '',  // alertas generales
  },
};
