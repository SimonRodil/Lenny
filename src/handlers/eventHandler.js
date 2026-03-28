// src/handlers/eventHandler.js
const fs   = require('fs');
const path = require('path');

function loadEvents(client) {
  const eventsPath = path.join(__dirname, '../events');
  const files = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));

  for (const file of files) {
    const event = require(path.join(eventsPath, file));

    if (!event.name || !event.execute) {
      console.warn(`[WARN] ${file} no tiene 'name' o 'execute' — saltando.`);
      continue;
    }

    // once = se dispara una sola vez (ej. clientReady)
    // on   = se dispara cada vez
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }

    console.log(`[EVT] ✔ ${event.name}`);
  }
}

module.exports = { loadEvents };