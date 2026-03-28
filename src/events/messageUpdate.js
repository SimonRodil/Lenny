const { logMessageEdit } = require('../modules/logger');

module.exports = {
  name: 'messageUpdate',
  once: false,
  async execute(oldMessage, newMessage, client) {
    await logMessageEdit(oldMessage, newMessage);
  },
};