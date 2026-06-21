const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../../config');
const eotdConfig = require('../../config/eotd');
const imageModule = require('../../modules/eotd/image');
const quizModule = require('../../modules/eotd/quiz');

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
        )
    ),

  async execute(interaction, client) {
    const mode = interaction.options.getString('mode');
    await interaction.deferReply({ flags: 64 });

    if (!esStaff(interaction.member)) {
      return await interaction.editReply('❌ Solo el equipo de moderación puede usar este comando.');
    }

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
      } else {
        result = await quizModule.sendQuiz(interaction, client, canalesValidos, roles, datos);
      }

      agregarHistorial(result.historyEntry);
      await interaction.editReply(result.mensaje);
    } catch (err) {
      console.error(`[EOTD:${mode}] Error:`, err.message);
      await interaction.editReply(`❌ Error al enviar el ejercicio: \`${err.message}\``);
    }
  },
};
