module.exports = {
  name: 'clientReady',
  once: true,
  execute(client) {
    console.log(`✅ Lenny está online como ${client.user.tag}`);
    console.log(`📦 ${client.commands.size} comandos cargados.`);
  },
};