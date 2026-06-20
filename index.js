require('dotenv').config();
const LennyClient       = require('./src/client');
const { loadCommands }  = require('./src/handlers/commandHandler');
const { loadEvents }    = require('./src/handlers/eventHandler');

const client = new LennyClient();

require('./src/handlers/banButtons')(client);

loadCommands(client);
loadEvents(client);

// ── API HTTP para el Dashboard ──
const createAPI = require('./src/api');
const apiApp = createAPI(client);
const API_PORT = process.env.API_PORT || 3456;
apiApp.listen(API_PORT, () => {
  console.log(`API Dashboard escuchando en http://localhost:${API_PORT}`);
});

client.login(process.env.TOKEN);