# Lenny — Discord Moderation Bot

Lenny is a Discord bot focused on server moderation with a fully built-out automod system, detailed logging, and a ban-button interface for moderators.

## Features

### AutoMod (completely configurable)
- **Palabras prohibidas** — Detecta y borra automáticamente insultos, slurs, amenazas, scams y contenido sexual explícito.
- **Anti-spam** — Timeout de 10min si un usuario repite el mismo mensaje 3+ veces en 60s.
- **Anti cross-channel spam** — Timeout de 2 días si un usuario publica el mismo texto en 3+ canales distintos.
- **Anti-links** — Bloquea URLs externas salvo dominios permitidos (YouTube, Twitch, Twitter, Spotify, etc.).
- **Palabras sospechosas** — Alerta silenciosa a mods ante frases de estafas, crypto scams, phishing (sin borrar el mensaje).
- **Cuentas sospechosas** — Al puntuar una cuenta nueva al unirse (edad, avatar, nombre, flags de Discord), alerta a mods si supera el umbral.
- **Botones de moderación** — Banear o redimir directamente desde las alertas de spam/sospechosos.

### Logging
- Log de mensajes eliminados
- Log de mensajes editados (deshabilitado por ahora)
- Log de miembros que se unen / se van

### Bienvenidas
- Mensaje de bienvenida configurable al unirse un nuevo miembro.

### Comandos
- `/ping` — Muestra la latencia del bot y de la API.
- `/test` — Comando placeholder.

## Stack técnico
- **Runtime:** Node.js 18+
- **Librería:** discord.js v14
- **Config:** `dotenv` + `config.js`

## Instalación

### Prerrequisitos
- Node.js 18 o superior
- Una aplicación de bot en el [Discord Developer Portal](https://discord.com/developers/applications)

### Setup

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/your-username/lenny.git
   cd lenny
   ```

2. **Instala dependencias:**
   ```bash
   npm install
   ```

3. **Configura variables de entorno:**
   - Copia `.env.example` a `.env`:
     ```bash
     cp .env.example .env
     ```
   - Rellena los valores:
     - `TOKEN` — token de tu bot (Discord Developer Portal → Bot)
     - `CLIENT_ID` — ID de tu aplicación (OAuth2 → General)
     - `GUILD_ID` — ID del servidor donde usarás los comandos

4. **Configura el bot:**
   - Copia `config-blank.js` a `config.js`.
   - Rellena los IDs de roles, canales y ajusta los módulos activos (`features`).

5. **Registra los comandos slash:**
   ```bash
   node deploy-commands.js
   ```

6. **Inicia el bot:**
   ```bash
   npm start
   ```

## Configuración (`config.js`)

Cada módulo del bot se puede activar/desactivar individualmente:

```js
features: {
  welcome: false,
  logJoin: false,
  logLeaves: false,
  automod: {
    enabled:          true,
    bannedWords:      true,
    spam:             true,
    crossChannelSpam: true,
    links:            true,
    suspiciousWords:  true,
    suspiciousAccounts: true,
  },
}
```

## Licencia
MIT
