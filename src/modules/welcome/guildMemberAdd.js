const { handleWelcome } = require('../modules/welcome');
const { logMemberJoin } = require('../modules/logger');

module.exports = {
  name: 'guildMemberAdd',
  once: false,
  async execute(member, client) {
    await handleWelcome(member);
    await logMemberJoin(member);   // 👈 añadir
  },
};