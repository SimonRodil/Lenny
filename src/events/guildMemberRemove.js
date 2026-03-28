const { logMemberLeave } = require('../modules/logger');

module.exports = {
  name: 'guildMemberRemove',
  once: false,
  async execute(member, client) {
    await logMemberLeave(member);
  },
};