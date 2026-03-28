const { handleWelcome }           = require('../modules/welcome');
const { logMemberJoin }           = require('../modules/logger');
const { checkSuspiciousAccount }  = require('../modules/automod/suspiciousAccounts');

module.exports = {
  name: 'guildMemberAdd',
  once: false,
  async execute(member, client) {
    await handleWelcome(member);
    await logMemberJoin(member);
    await checkSuspiciousAccount(member); // 👈 detección de cuentas sospechosas
  },
};