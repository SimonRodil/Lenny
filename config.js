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
<<<<<<< HEAD
    admin:    '',
    modSenior:'',
    mod:      '',
    team:     '',
=======
    admin:    '793079297808138240',
    modSenior:'793079297808138240',
    mod:      '793079297808138240',
    team:     '793079297808138240',
>>>>>>> 966b8a7 (Add initial configuration for the bot)
    verified: '',
  },

  // IDs de canales importantes
  channels: {
<<<<<<< HEAD
    logs:         '',  // canal general (puedes dejarlo o quitarlo)
    welcome:      '',  // bienvenida (la desactivamos, pero dejamos la key)
    logsSuspect:  '',  // alertas de cuentas sospechosas
    logsSpam:     '',  // alertas de spam
    logsLinks:    '',  // alertas de links
    general:      '',  // alertas generales
=======
    logs:         '1487382936301863044',  // canal general (puedes dejarlo o quitarlo)
    welcome:      '1487382936301863044',  // bienvenida (la desactivamos, pero dejamos la key)
    logsSuspect:  '1487382936301863044',  // alertas de cuentas sospechosas
    logsSpam:     '1487382936301863044',  // alertas de spam
    logsLinks:    '1487382936301863044',  // alertas de links
    general:      '1487382936301863044',  // alertas generales
>>>>>>> 966b8a7 (Add initial configuration for the bot)
  },
};
