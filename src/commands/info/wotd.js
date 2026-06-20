const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../../config');
const wotdConfig = require('../../config/wotd');

const HISTORY_PATH = path.join(__dirname, '../../../data/wotd-history.json');

const CATEGORIAS = [
  'nature', 'travel', 'architecture', 'landscape', 'city',
  'food', 'animals', 'water', 'forest', 'mountain',
  'beach', 'street', 'market', 'garden', 'sunset',
  'interior', 'village', 'river', 'lake', 'flower',
  'wildlife', 'farm', 'night', 'rain', 'snow',
];

const MENSAJES = {
  spanish: {
    titulo: '🌍 **Word of the Day — Describe this image!**',
    desc: 'What can you see in this picture? Try to describe everything you can — colors, objects, people, actions, weather... The more details, the better!',
    descIt: '*¿Qué ves en esta imagen? Intenta describir todo lo que puedas — colores, objetos, personas, acciones, clima... ¡Mientras más detalles, mejor!*',
    ejemplo: '📝 **Example:**\n"There is a green tree on a hill next to a waterfall"\n*"Hay un árbol verde en una colina junto a una cascada"*',
    footer: '📷 Image by',
    enlace: 'on Unsplash',
  },
  english: {
    titulo: '🌍 **Palabra del Día — ¡Describe esta imagen!**',
    desc: '¿Qué ves en esta imagen? Intenta describir todo lo que puedas — colores, objetos, personas, acciones, clima... ¡Mientras más detalles, mejor!',
    descIt: '*What can you see in this picture? Try to describe everything you can — colors, objects, people, actions, weather... The more details, the better!*',
    ejemplo: '📝 **Ejemplo:**\n"Hay un árbol verde en una colina junto a una cascada"\n*"There is a green tree on a hill next to a waterfall"*',
    footer: '📷 Foto por',
    enlace: 'en Unsplash',
  },
};

function idEsValido(id) {
  return id && typeof id === 'string' && id.trim().length > 0 && /^\d{17,20}$/.test(id.trim());
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

const CATEGORIA_AL_REVES = {
  naturaleza: 'nature', viajes: 'travel', arquitectura: 'architecture',
  paisaje: 'landscape', ciudad: 'city', comida: 'food',
  animales: 'animals', agua: 'water', bosque: 'forest',
  montaña: 'mountain', playa: 'beach', calle: 'street',
  mercado: 'market', jardín: 'garden', atardecer: 'sunset',
  interior: 'interior', pueblo: 'village', río: 'river',
  lago: 'lake', flores: 'flower', 'vida salvaje': 'wildlife',
  granja: 'farm', noche: 'night', lluvia: 'rain', nieve: 'snow',
};

function obtenerDatos() {
  try {
    if (fs.existsSync(HISTORY_PATH)) {
      const history = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));
      if (Array.isArray(history) && history.length > 0) {
        const ultimo = history[0];
        const categorias = history.map(e => e.categoryKey || CATEGORIA_AL_REVES[e.category] || e.category.toLowerCase());
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

function seleccionarCategoria(categoriasUsadas) {
  const disponibles = CATEGORIAS.filter(c => !categoriasUsadas.includes(c));

  if (disponibles.length === 0) {
    return CATEGORIAS[Math.floor(Math.random() * CATEGORIAS.length)];
  }

  return disponibles[Math.floor(Math.random() * disponibles.length)];
}

function traducirCategoria(cat) {
  const mapa = {
    nature: 'naturaleza', travel: 'viajes', architecture: 'arquitectura',
    landscape: 'paisaje', city: 'ciudad', food: 'comida',
    animals: 'animales', water: 'agua', forest: 'bosque',
    mountain: 'montaña', beach: 'playa', street: 'calle',
    market: 'mercado', garden: 'jardín', sunset: 'atardecer',
    interior: 'interior', village: 'pueblo', river: 'río',
    lake: 'lago', flower: 'flores', wildlife: 'vida salvaje',
    farm: 'granja', night: 'noche', rain: 'lluvia', snow: 'nieve',
  };
  return mapa[cat] || cat;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wotd')
    .setDescription('Envía una imagen aleatoria de Unsplash a los canales de práctica'),

  async execute(interaction, client) {
    await interaction.deferReply({ flags: 64 });

    if (!esStaff(interaction.member)) {
      return await interaction.editReply('❌ Solo el equipo de moderación puede usar este comando.');
    }

    const datos = obtenerDatos();
    if (datos.fecha === hoy()) {
      return await interaction.editReply('⏳ Ya se envió la imagen del día hoy. Vuelve mañana.');
    }

    try {
      const canales = wotdConfig.canales;
      const roles = wotdConfig.roles;
      const canalesValidos = Object.entries(canales).filter(([, id]) => idEsValido(id));

      if (canalesValidos.length === 0) {
        return await interaction.editReply(
          '❌ No hay canales configurados en `src/config/wotd.js`.\n'
          + 'Asegúrate de haber puesto IDs válidos (18-20 dígitos) en `canales.spanish` y `canales.english`.'
        );
      }

      const categoria = seleccionarCategoria(datos.categoriasUsadas || []);
      const catEsp = traducirCategoria(categoria);

      const url = `https://api.unsplash.com/photos/random?orientation=landscape&content_filter=high&query=${categoria}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` },
      });

      if (!res.ok) {
        return await interaction.editReply('❌ Error al obtener imagen de Unsplash. Revisa que la API key en `.env` sea correcta.');
      }

      const data = await res.json();
      const tituloCat = `${catEsp.charAt(0).toUpperCase() + catEsp.slice(1)}`;

      let enviados = 0;
      const envios = [];

      for (const [idioma, canalId] of canalesValidos) {
        const canal = client.channels.cache.get(canalId.trim());
        if (!canal) continue;

        const msg = MENSAJES[idioma];
        const rolId = roles[idioma];
        const contenido = idEsValido(rolId) ? `<@&${rolId.trim()}>` : undefined;

        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle(`${msg.titulo} — ${tituloCat}`)
          .setDescription(`${msg.desc}\n\n${msg.descIt}\n\n${msg.ejemplo}`)
          .setImage(data.urls.regular)
          .setFooter({ text: `${msg.footer} ${data.user.name} ${msg.enlace}`, iconURL: data.user.profile_image?.small })
          .setTimestamp();

        const sent = await canal.send({ content: contenido, embeds: [embed] });
        envios.push({
          channelId: canal.id,
          channelName: idioma,
          messageId: sent.id,
          photoUrl: data.urls.regular,
          timestamp: new Date().toISOString(),
        });
        enviados++;
      }

      if (enviados === 0) {
        return await interaction.editReply('⚠️ No se pudo enviar a ningún canal. Revisa que los IDs en `src/config/wotd.js` sean correctos y que el bot tenga acceso a esos canales.');
      }

      agregarHistorial({
        date: hoy(),
        category: tituloCat,
        categoryKey: categoria,
        photographer: data.user.name,
        url: data.urls.regular,
        envios,
      });
      await interaction.editReply(`✅ Imagen enviada (${tituloCat}) a ${enviados} canal(es).`);
    } catch (err) {
      console.error('[WOTD] Error:', err.message);
      await interaction.editReply('❌ Error al conectar con Unsplash. Intenta de nuevo.');
    }
  },
};
