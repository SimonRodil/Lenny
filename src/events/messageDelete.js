const { logMessageDelete } = require('../modules/logger');

module.exports = {
  name: 'messageDelete',
  once: false,
  async execute(message, client) {
    await logMessageDelete(message);
  },
};