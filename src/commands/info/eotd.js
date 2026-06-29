const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../../config');
const eotdConfig = require('../../config/eotd');
const imageModule = require('../../modules/eotd/image');
const quizModule = require('../../modules/eotd/quiz');
const autocompleteModule = require('../../modules/eotd/autocomplete');

const HISTORY_PATH = path.join(__dirname, '../../../data/eotd-history.json');

function idEsValido(id) {
  return id && typeof id === 'string' && /^\d{17,20}$/.test(id.trim());
}

function esStaff(member) {
  if (!member) return false;
  if (member.id === member.guild?.ownerId) return true;
  if (member.permissions?.has('Administrator')) return true;
  if (!member.roles?.cache) return false;
  const staffRoleIds = config.roles.staff.map(k => config.roles[k]);
  return staffRoleIds.some(id => member.roles.cache.has(id));
}

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

function obtenerDatos() {
  try {
    if (fs.existsSync(HISTORY_PATH)) {
      const history = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));
      if (Array.isArray(history) && history.length > 0) {
        const ultimo = history[0];
        const categorias = history
          .filter(e => e.mode === 'image')
          .map(e => e.categoryKey || '');
        return { fecha: ultimo.date, categoriasUsadas: categorias };
      }
    }
  } catch {}
  return { fecha: null, categoriasUsadas: [] };
}

/**
 * Busca el ejercicio de autocomplete más reciente no revelado
 * y publica las respuestas en el canal correspondiente.
 */
async function revelarSiPendiente(client) {
  try {
    if (!fs.existsSync(HISTORY_PATH)) return;
    const history = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));
    if (!Array.isArray(history)) return;

    for (const entry of history) {
      if (entry.mode === 'autocomplete' && !entry.revealed) {
        const revealed = await autocompleteModule.revealAnswers(client, entry);
        if (revealed) {
          entry.revealed = true;
          fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
          console.log('[EOTD] Respuestas de autocomplete reveladas correctamente.');
        }
        break; // Solo el más reciente
      }
    }
  } catch (err) {
    console.error('[EOTD] Error al revelar autocomplete pendiente:', err.message);
  }
}

function agregarHistorial(entry) {
  try {
    const dir = path.dirname(HISTORY_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    let history = [];
    try { history = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8')); } catch {}
    if (!Array.isArray(history)) history = [];
    history.unshift(entry);
    if (history.length > 30) history.length = 30;
    fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
  } catch {}
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('eotd')
    .setDescription('Exercise of the Day — envía un ejercicio a los canales de práctica')
    .addStringOption(option =>
      option.setName('mode')
        .setDescription('Tipo de ejercicio')
        .setRequired(true)
        .addChoices(
          { name: '📷 Imagen — describe una foto', value: 'image' },
          { name: '🧠 Quiz — adivina el significado', value: 'quiz' },
          { name: '🧩 Autocomplete — completa la oración', value: 'autocomplete' },
        )
    )
    .addBooleanOption(option =>
      option.setName('test')
        .setDescription('🔬 Modo prueba: envía solo al canal de test sin roles ni history')
        .setRequired(false)
    ),

  async execute(interaction, client) {
    const mode = interaction.options.getString('mode');
    const testMode = interaction.options.getBoolean('test') || false;
    await interaction.deferReply({ flags: 64 });

    if (!esStaff(interaction.member)) {
      return await interaction.editReply('❌ Solo el equipo de moderación puede usar este comando.');
    }

    // Revelar respuestas de autocomplete pendientes (del día anterior)
    // Solo en modo no-test
    if (!testMode) await revelarSiPendiente(client);

    // ── Modo test: un solo canal, sin roles, sin history, sin límite diario ──
    if (testMode) {
      const testId = eotdConfig.testChannel;
      if (!idEsValido(testId)) {
        return await interaction.editReply('❌ `testChannel` no está configurado o el ID no es válido en `src/config/eotd.js`.');
      }

      const testCanal = client.channels.cache.get(testId.trim());
      if (!testCanal) {
        return await interaction.editReply('❌ El canal de test no existe o el bot no tiene acceso.');
      }

      const testCanales = [['spanish', testId.trim()], ['english', testId.trim()]];
      const sinRoles = { spanish: '', english: '' };

      try {
        let result;
        if (mode === 'image') {
          result = await imageModule.sendImage(interaction, client, testCanales, sinRoles, { fecha: null, categoriasUsadas: [] });
        } else if (mode === 'quiz') {
          result = await quizModule.sendQuiz(interaction, client, testCanales, sinRoles, { fecha: null, categoriasUsadas: [] });
        } else if (mode === 'autocomplete') {
          result = await autocompleteModule.sendAutocomplete(interaction, client, testCanales, sinRoles, { fecha: null, categoriasUsadas: [] });
        }

        // No guardar en history en modo test
        await interaction.editReply(`🧪 **TEST** — ${result.mensaje.replace('✅', '')}`);
      } catch (err) {
        console.error(`[EOTD:${mode}] Error en test:`, err.message);
        await interaction.editReply(`🧪 **TEST** — ❌ Error: \`${err.message}\``);
      }
      return;
    }

    // ── Modo producción ──
    const datos = obtenerDatos();
    if (datos.fecha === hoy()) {
      return await interaction.editReply('⏳ Ya se envió el EOTD hoy. Vuelve mañana.');
    }

    const canales = eotdConfig.canales;
    const roles = eotdConfig.roles;
    const canalesValidos = Object.entries(canales).filter(([, id]) => idEsValido(id));

    if (canalesValidos.length === 0) {
      return await interaction.editReply(
        '❌ No hay canales configurados en `src/config/eotd.js`.\n'
        + 'Asegúrate de haber puesto IDs válidos (18-20 dígitos) en `canales.spanish` y `canales.english`.'
      );
    }

    try {
      let result;

      if (mode === 'image') {
        result = await imageModule.sendImage(interaction, client, canalesValidos, roles, datos);
      } else if (mode === 'quiz') {
        result = await quizModule.sendQuiz(interaction, client, canalesValidos, roles, datos);
      } else if (mode === 'autocomplete') {
        result = await autocompleteModule.sendAutocomplete(interaction, client, canalesValidos, roles, datos);
      }

      agregarHistorial(result.historyEntry);
      await interaction.editReply(result.mensaje);
    } catch (err) {
      console.error(`[EOTD:${mode}] Error:`, err.message);
      await interaction.editReply(`❌ Error al enviar el ejercicio: \`${err.message}\``);
    }
  },
};
