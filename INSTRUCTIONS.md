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
| `UNSPLASH_ACCESS_KEY` | [unsplash.com/developers](https://unsplash.com/developers) → New Application → Access Key |

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

## 8. Comando /eotd — Imagen del día (Exercise of the Day)

Envía una imagen aleatoria de Unsplash a 2 canales (uno para estudiantes de español,
otro para estudiantes de inglés) para que practiquen describiendo imágenes.

### 8.1 Conseguir API key de Unsplash

1. Ve a [unsplash.com/developers](https://unsplash.com/developers) y crea una cuenta
2. Crea una **New Application** (puedes ponerle "Lenny EOTD")
3. Copia el **Access Key** y ponlo en `.env`:

```
UNSPLASH_ACCESS_KEY=tu_access_key_aqui
```

### 8.2 Configurar canales y roles

Crea `src/config/eotd.js` a partir de la plantilla:

```bash
cp src/config/eotd-blank.js src/config/eotd.js
```

Edítalo con los IDs de tu servidor:

```js
module.exports = {
  canales: {
    spanish: '123456789012345678',  // Canal donde aprenden español
    english: '123456789012345679',  // Canal donde aprenden inglés
  },
  roles: {
    spanish: '123456789012345680',  // Rol @español (estudiantes de español)
    english: '123456789012345681',  // Rol @english (estudiantes de inglés)
  },
};
```

Los IDs se obtienen con Modo Desarrollador activado → Click derecho en canal/rol → Copiar ID.

### 8.3 Usar /eotd

Una vez configurado, ejecuta `/eotd` en cualquier canal donde el bot pueda verlo.
El bot enviará la imagen a los 2 canales configurados con el mensaje adecuado
para cada idioma y mencionando los roles correspondientes.

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
