// src/events/messageUpdate.js

const { logMessageEdit } = require('../modules/logger');

module.exports = {
  name: 'messageUpdate',
  once: false,
  async execute(oldMessage, newMessage, client) {
    // Desactivado.
    // await logMessageEdit(oldMessage, newMessage);
  },
};