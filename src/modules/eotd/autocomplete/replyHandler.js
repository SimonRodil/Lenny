// src/modules/eotd/autocomplete/replyHandler.js
// Maneja las respuestas de usuarios a mensajes de autocomplete
// Reacciona con ✅ o ❌ según si la respuesta es correcta

/**
 * Procesa un mensaje que es reply a un ejercicio de autocomplete.
 * @param {import('discord.js').Message} message - Mensaje del usuario
 * @param {import('discord.js').Client} client - Bot client
 * @returns {Promise<boolean>} - true si se procesó como autocomplete, false si no
 */
async function handleAutocompleteReply(message, client) {
  // Solo procesar si es reply a un mensaje
  if (!message.reference?.messageId) return false;

  // Ignorar bots
  if (message.author.bot) return false;

  // Buscar en el cache de autocomplete
  const cacheEntry = client.autocompleteCache?.get(message.reference.messageId);
  if (!cacheEntry) return false;

  const { correctAnswer, language } = cacheEntry;

  // Normalizar respuesta del usuario y la correcta
  const userAnswer = message.content.trim().toLowerCase().replace(/[^\wáéíóúñü\s]/g, '');
  const expectedAnswer = correctAnswer.trim().toLowerCase().replace(/[^\wáéíóúñü\s]/g, '');

  // Comparar
  const isCorrect = userAnswer === expectedAnswer;

  // Reaccionar
  try {
    await message.react(isCorrect ? '✅' : '❌');
  } catch (err) {
    console.error('[Autocomplete Reply] Error al reaccionar:', err.message);
  }

  return true;
}

module.exports = { handleAutocompleteReply };
