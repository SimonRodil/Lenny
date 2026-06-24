const { logMessageDelete } = require('../modules/logger');

module.exports = {
  name: 'messageDelete',
  once: false,
  async execute(message, client) {
    if (message.partial) {
      try {
        await message.fetch();
      } catch {
        return;
      }
    }

    await logMessageDelete(message);
  },
};