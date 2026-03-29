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
    admin:    '765240859204911135',
    modSenior:'715891774010425396',
    mod:      '839015347066765323',
    team:     '759325778391072768',
    verified: '',
  },

  // IDs de canales importantes
  channels: {
    logs:         '1487454937729470484',  // canal general (puedes dejarlo o quitarlo)
    welcome:      '1116534850191638538',  // bienvenida (la desactivamos, pero dejamos la key)
    logsSuspect:  '1487449646887342263',  // 🆕 alertas de cuentas sospechosas
    logsSpam:     '1487461453215830086',  // 🆕 alertas de spam
    logsLinks:    '1487449697294618845',  // 🆕 alertas de links
    general:  '1154067768627441807',
  },
};