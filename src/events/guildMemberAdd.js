const { handleWelcome }           = require('../modules/welcome');
const { logMemberJoin }           = require('../modules/logger');
const { checkSuspiciousAccount }  = require('../modules/automod/suspiciousAccounts');
const config = require('../../config');

module.exports = {
  name: 'guildMemberAdd',
  once: false,
  async execute(member, client) {
    await handleWelcome(member);
    await logMemberJoin(member);
    if (config.features.automod?.suspiciousAccounts) {
      await checkSuspiciousAccount(member);
    }
  },
};