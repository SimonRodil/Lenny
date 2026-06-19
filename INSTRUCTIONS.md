# Instrucciones — Lenny Bot

## 1. Requisitos

- Node.js 18+
- Una aplicación de bot en el [Discord Developer Portal](https://discord.com/developers/applications)
- El bot debe tener estos **intents** activados (Developer Portal → Bot → Privileged Gateway Intents):
  - ✅ Server Members Intent
  - ✅ Message Content Intent

## 2. Instalación

```bash
git clone https://github.com/your-username/lenny.git
cd lenny
npm install
```

## 3. Variables de entorno

Copia y rellena:

```bash
cp .env.example .env
```

| Variable | Dónde obtenerlo |
|---|---|
| `TOKEN` | Developer Portal → Bot → Token (Reset Token) |
| `CLIENT_ID` | Developer Portal → OAuth2 → General → Client ID |
| `GUILD_ID` | Activa Modo Desarrollador en Discord → Click derecho en tu servidor → Copiar ID |

## 4. Configuración del bot

```bash
cp config-blank.js config.js
```

Edita `config.js` y rellena al menos:

- **`roles`** — IDs de los roles de admin/mod/team
- **`channels`** — IDs de los canales donde el bot enviará logs y alertas
- **`features`** — Pon en `true` los módulos que quieras activar

## 5. Registrar comandos slash

Solo la primera vez o cuando agregues/quites comandos:

```bash
node deploy-commands.js
```

## 6. Iniciar el bot

```bash
npm start
```

## 7. Verificar que funciona

En Discord, ejecuta `/ping` en tu servidor. Debería responder con la latencia.

---

## Toggles rápidos (config.js → features)

```js
features: {
  welcome:            false,  // mensaje de bienvenida
  logJoin:            false,  // log cuando alguien entra
  logLeaves:          false,  // log cuando alguien se va
  automod: {
    enabled:          true,   // master switch del automod
    bannedWords:      true,   // borra insultos/scams
    spam:             true,   // timeout 10min por repetir
    crossChannelSpam: true,   // timeout 2d por multicanal
    links:            true,   // bloquea links no permitidos
    suspiciousWords:  true,   // alerta de estafas/phishing
    suspiciousAccounts: true, // alerta de cuentas nuevas sospechosas
  },
}
```

## Solución de problemas

| Problema | Causa posible |
|---|---|
| `Cannot find module 'discord.js'` | No ejecutaste `npm install` |
| `TOKEN is not defined` | No creaste `.env` o falta la variable |
| Los comandos slash no aparecen | No ejecutaste `node deploy-commands.js` |
| El bot no responde | El bot no tiene permisos en el canal o falta el intent `Message Content` |
