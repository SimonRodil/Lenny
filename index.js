require('dotenv').config();
const LennyClient       = require('./src/client');
const { loadCommands }  = require('./src/handlers/commandHandler');
const { loadEvents }    = require('./src/handlers/eventHandler');

const client = new LennyClient();

loadCommands(client);
loadEvents(client);

client.login(process.env.TOKEN);