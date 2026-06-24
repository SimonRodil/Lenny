---
name: discord
description: Desarrollo con discord.js v14 para el bot Lenny - comandos slash, eventos, módulos de moderación (automod, welcome, logger), EOTD bilingüe, dashboard API Express, y convenciones del proyecto.
---

## Stack
- **Runtime:** Node.js 18+, CommonJS (`require`/`module.exports`)
- **Librería principal:** discord.js `^14.24.2`
- **API embebida:** Express 5 + CORS (dashboard en mismo proceso)
- **Imágenes:** `sharp` (perceptual hashing para anti-spam cross-channel)
- **Sin TypeScript** — todo JS plano
- **Sin DB** — persistencia en JSON (`data/automod.json`, `data/eotd-history.json`)
- **Start:** `nodemon index.js` (dev: `npm run dev` registra comandos + inicia)

## Bootstrap (`index.js`)
1. `dotenv` carga `.env`
2. Se crea `LennyClient` (extiende `Client`)
3. `loadCommands(client)` — escanea `src/commands/` dinámicamente
4. `loadEvents(client)` — escanea `src/events/` dinámicamente
5. `banButtons(client)` — registra listeners de botones de moderación
6. Express API se inicia en `API_PORT` (`.env` o 3456)
7. `client.login(TOKEN)` — conecta con Discord

### Intents activos
`Guilds | GuildMessages | GuildMembers | MessageContent`

## Estructura del proyecto
- **`index.js`** — Entry point del bot
- **`config.js`** — Config centralizada (colores, emojis, feature flags, IDs roles/canales)
- **`deploy-commands.js`** — Registra comandos slash en el servidor de prueba vía REST
- **`src/client.js`** — `LennyClient` extends `Client` con `Collection`s para commands, cooldowns, commandCounts, messageCounts
- **`src/events/`** — 7 eventos: `ready`, `interactionCreate`, `messageCreate`, `messageDelete`, `messageUpdate` (disabled), `guildMemberAdd`, `guildMemberRemove`
- **`src/commands/info/`** — Comandos slash: `ping`, `eotd`
- **`src/modules/automod/`** — AutoMod centralizado (~864 líneas)
  - `index.js` — Orquestador: bannedWords, spam, crossChannel, links, suspiciousWords
  - `suspiciousAccounts.js` — Scoring de cuentas nuevas (edad, avatar, flags, username)
- **`src/modules/eotd/`** — Exercise of the Day bilingüe
  - `image/index.js` — Foto aleatoria de Unsplash por categoría
  - `quiz/index.js` — Quiz con polls (diccionario + fallback local ES/EN)
  - `quiz/fallback.js` — 50 palabras inglés con definiciones
  - `quiz/fallback-es.js` — 50 palabras español con definiciones
- **`src/modules/logger/index.js`** — Logging de joins, leaves, deletes, edits
- **`src/modules/welcome/index.js`** — Mensaje de bienvenida configurable
- **`src/handlers/commandHandler.js`** — Carga comandos por carpeta-categoría
- **`src/handlers/eventHandler.js`** — Carga eventos, soporta `once`
- **`src/handlers/banButtons.js`** — Botones: `spam_ban_`, `suspect_ban_`, `spam_redeem_` (solo staff)
- **`src/api/index.js`** — Express REST API con Bearer token
  - Endpoints: status, channels, automod CRUD, members search/detail, moderate (ban/kick/timeout), send-message, eotd control
- **`src/config/eotd.js`** — Config de EOTD (canales y roles específicos)
- **`utils/embed.js`** — Helpers para crear embeds con colores/estilos consistentes
- **`data/`** — Persistencia: `automod.json` (palabras+settings), `eotd-history.json`, `banned-links.txt`

## Convenciones de código
- **Comandos slash:** `SlashCommandBuilder` con `.setDMPermission(false)`. Archivos en `src/commands/<categoria>/<nombre>.js`. Exportan `{ data, execute }`.
- **Eventos:** Exportan `{ name, once, execute }`. El handler recibe `(...args, client)`. `once: true` para eventos de una sola vez (ej: `clientReady`).
- **Embeds:** Usar `EmbedBuilder` de discord.js (no objetos planos). Colores desde `config.colors.*` (`primary: 0x5865F2`, `success`, `warning`, `error`, `neutral`).
- **Botones:** `ActionRowBuilder` + `ButtonBuilder` + `ButtonStyle`. IDs con prefijo para identificar tipo en el handler.
- **Respuestas efímeras:** `interaction.reply({ flags: 64 })` o `MessageFlags.Ephemeral`.
- **Config centralizada:** IDs de canales/roles se leen de `config.channels.*` y `config.roles.*`. Nunca hardcodeados.
- **Feature flags:** Módulos se togglean desde `config.features.*`. Verificar flag antes de ejecutar lógica.
- **Errores:** `console.error('[Modulo] mensaje:', err.message)`. Siempre try/catch en eventos y comandos.
- **Cooldowns:** Usar `client.cooldowns` (Collection). Almacenar timestamp + timer.
- **AutoMod:** Centralizado en `src/modules/automod/index.js`. Cada checker recibe `(message, config, client)`.
- **Logging:** Sistema consistente con embeds de color según tipo (join=success, leave=warning, delete=error).
- **EOTD:** Bilingüe (ES/EN). Canales destino desde `src/config/eotd.js`. Polls con duración 24h.
- **API Dashboard:** Autenticación via header `Authorization: Bearer <API_TOKEN>`. JSON responses con `{ success, data/error }`.
- **Persistencia:** `data/automod.json` y `data/eotd-history.json` se leen en startup y se escriben ante cambios. Manejar JSON corrupto con try/catch.
