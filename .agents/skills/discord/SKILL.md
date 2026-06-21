---
name: discord
description: Desarrollo con discord.js v14 para el bot Lenny - comandos slash, eventos, módulos de moderación, y convenciones del proyecto
---

## Stack
- **Librería:** discord.js v14 (`^14.24.2`)
- **Runtime:** Node.js 18+
- **Bot type:** Moderación con AutoMod, logging, welcome, dashboard API

## Estructura del proyecto
- `config.js` — Configuración centralizada (roles, canales, colores, features)
- `src/client.js` — `LennyClient` extends `Client` con intents y collections
- `src/events/` — Eventos de Discord (`messageCreate`, `guildMemberAdd`, etc.)
- `src/commands/` — Comandos slash (subcarpeta por categoría)
- `src/modules/` — Lógica de negocio (`automod/`, `logger/`, `welcome/`)
- `src/handlers/` — Handlers secundarios (`banButtons.js`)
- `src/api/` — Express REST API para dashboard
- `utils/embed.js` — Helpers para crear embeds

## Convenciones
- Usar `EmbedBuilder` de discord.js (no objetos planos en new code)
- Botones con `ActionRowBuilder` + `ButtonBuilder` + `ButtonStyle`
- Comandos: `SlashCommandBuilder` con `.setDMPermission(false)`
- Eventos exportan `{ name, once, execute }`
- Canales y roles se leen de `config.channels.*` y `config.roles.*`
- Feature flags en `config.features.*` para togglear módulos
- Errores en catch con `console.error('[Modulo] mensaje:', err.message)`
- Embeds usan `config.colors.*` para consistencia visual
- Módulo automod centralizado en `src/modules/automod/index.js`
- Logging de eventos en `src/modules/logger/index.js`
- Usar `Interaction#flags: 64` para respuestas efímeras
