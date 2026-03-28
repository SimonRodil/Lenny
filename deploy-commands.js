// deploy-commands.js
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs   = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'src/commands');
const categories = fs.readdirSync(commandsPath);

for (const category of categories) {
  const files = fs.readdirSync(path.join(commandsPath, category))
    .filter(f => f.endsWith('.js'));

  for (const file of files) {
    const command = require(path.join(commandsPath, category, file));
    if (command.data) commands.push(command.data.toJSON());
  }
}

const rest = new REST().setToken(process.env.TOKEN);

(async () => {
  try {
    console.log(`📡 Registrando ${commands.length} comandos...`);

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log('✅ Comandos registrados en el servidor de prueba.');
  } catch (err) {
    console.error(err);
  }
})();