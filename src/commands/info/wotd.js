const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../../config');
const wotdConfig = require('../../config/wotd');

const COOLDOWN_PATH = path.join(__dirname, '../../../data/wotd-last.json');

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
  if (!member?.roles?.cache) return false;
  const staffRoleIds = config.roles.staff.map(k => config.roles[k]);
  return staffRoleIds.some(id => member.roles.cache.has(id));
}

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

function obtenerDatos() {
  try {
    if (fs.existsSync(COOLDOWN_PATH)) {
      return JSON.parse(fs.readFileSync(COOLDOWN_PATH, 'utf8'));
    }
  } catch {}
  return { fecha: null, categoriasUsadas: [] };
}

function guardarDatos(datos) {
  try {
    const dir = path.dirname(COOLDOWN_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(COOLDOWN_PATH, JSON.stringify(datos));
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
    await interaction.deferReply({ ephemeral: true });

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

        await canal.send({ content: contenido, embeds: [embed] });
        enviados++;
      }

      if (enviados === 0) {
        return await interaction.editReply('⚠️ No se pudo enviar a ningún canal. Revisa que los IDs en `src/config/wotd.js` sean correctos y que el bot tenga acceso a esos canales.');
      }

      const usadas = [...(datos.categoriasUsadas || []), categoria];
      if (usadas.length >= CATEGORIAS.length) usadas.length = 0;

      guardarDatos({ fecha: hoy(), categoriasUsadas: usadas });
      await interaction.editReply(`✅ Imagen enviada (${tituloCat}) a ${enviados} canal(es).`);
    } catch (err) {
      console.error('[WOTD] Error:', err.message);
      await interaction.editReply('❌ Error al conectar con Unsplash. Intenta de nuevo.');
    }
  },
};
