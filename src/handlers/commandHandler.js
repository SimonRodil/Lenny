// src/handlers/commandHandler.js
const fs   = require('fs');
const path = require('path');

function loadCommands(client) {
  const commandsPath = path.join(__dirname, '../commands');

  // Lee cada subcarpeta (categoría: admin, fun, info, etc.)
  const categories = fs.readdirSync(commandsPath);

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);

    // Ignora si no es una carpeta
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'));

    for (const file of files) {
      const command = require(path.join(categoryPath, file));

      // Validación: el archivo debe exportar 'data' y 'execute'
      if (!command.data || !command.execute) {
        console.warn(`[WARN] ${file} no tiene 'data' o 'execute' — saltando.`);
        continue;
      }

      client.commands.set(command.data.name, command);
      console.log(`[CMD] ✔ /${command.data.name} (${category})`);
    }
  }
}

module.exports = { loadCommands };