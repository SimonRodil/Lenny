const { EmbedBuilder } = require('discord.js');

const CATEGORIAS = [
  'nature', 'travel', 'architecture', 'landscape', 'city',
  'food', 'animals', 'water', 'forest', 'mountain',
  'beach', 'street', 'market', 'garden', 'sunset',
  'interior', 'village', 'river', 'lake', 'flower',
  'wildlife', 'farm', 'night', 'rain', 'snow',
];

const MENSAJES = {
  spanish: {
    titulo: '🌍 **Ejercicio del Día — ¡Describe esta imagen!**',
    desc: '¿Qué ves en esta imagen? Intenta describir todo lo que puedas — colores, objetos, personas, acciones, clima... ¡Mientras más detalles, mejor!',
    descIt: '*What can you see in this picture? Try to describe everything you can — colors, objects, people, actions, weather... The more details, the better!*',
    ejemplo: '📝 **Ejemplo:**\n"Hay un árbol verde en una colina junto a una cascada"\n*"There is a green tree on a hill next to a waterfall"*',
    footer: '📷 Foto por',
    enlace: 'en Unsplash',
  },
  english: {
    titulo: '🌍 **Exercise of the Day — Describe this image!**',
    desc: 'What can you see in this picture? Try to describe everything you can — colors, objects, people, actions, weather... The more details, the better!',
    descIt: '*¿Qué ves en esta imagen? Intenta describir todo lo que puedas — colores, objetos, personas, acciones, clima... ¡Mientras más detalles, mejor!*',
    ejemplo: '📝 **Example:**\n"There is a green tree on a hill next to a waterfall"\n*"Hay un árbol verde en una colina junto a una cascada"*',
    footer: '📷 Image by',
    enlace: 'on Unsplash',
  },
};

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

async function sendImage(interaction, client, canalesValidos, roles, datos) {
  const categoria = seleccionarCategoria(datos.categoriasUsadas || []);
  const catEsp = traducirCategoria(categoria);
  const tituloCat = `${catEsp.charAt(0).toUpperCase() + catEsp.slice(1)}`;

  const url = `https://api.unsplash.com/photos/random?orientation=landscape&content_filter=high&query=${categoria}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` },
  });

  if (!res.ok) {
    return await interaction.editReply('❌ Error al obtener imagen de Unsplash. Revisa que la API key en `.env` sea correcta.');
  }

  const data = await res.json();
  let enviados = 0;
  const envios = [];

  for (const [idioma, canalId] of canalesValidos) {
    const canal = client.channels.cache.get(canalId.trim());
    if (!canal) continue;

    const msg = MENSAJES[idioma];
    const rolId = roles[idioma];
    const contenido = /^\d{17,20}$/.test((rolId || '').trim()) ? `<@&${rolId.trim()}>` : undefined;

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
    return await interaction.editReply('⚠️ No se pudo enviar a ningún canal. Revisa que los IDs en `src/config/eotd.js` sean correctos y que el bot tenga acceso a esos canales.');
  }

  const historyEntry = {
    date: new Date().toISOString().slice(0, 10),
    mode: 'image',
    category: tituloCat,
    categoryKey: categoria,
    photographer: data.user.name,
    url: data.urls.regular,
    envios,
  };

  return { historyEntry, enviados, mensaje: `✅ Imagen enviada (${tituloCat}) a ${enviados} canal(es).` };
}

async function sendImageFromAPI(client, canalesValidos, roles, datos) {
  const categoria = seleccionarCategoria(datos.categoriasUsadas || []);
  const catEsp = traducirCategoria(categoria);
  const tituloCat = `${catEsp.charAt(0).toUpperCase() + catEsp.slice(1)}`;

  const url = `https://api.unsplash.com/photos/random?orientation=landscape&content_filter=high&query=${categoria}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` },
  });

  if (!res.ok) return { error: 'Unsplash error' };

  const data = await res.json();
  const envios = [];

  for (const [idioma, canalId] of canalesValidos) {
    const canal = client.channels.cache.get(canalId.trim());
    if (!canal) continue;

    const msg = MENSAJES[idioma];
    const rolId = roles[idioma];
    const contenido = /^\d{17,20}$/.test((rolId || '').trim()) ? `<@&${rolId.trim()}>` : undefined;

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
  }

  const historyEntry = {
    date: new Date().toISOString().slice(0, 10),
    mode: 'image',
    category: tituloCat,
    categoryKey: categoria,
    photographer: data.user.name,
    url: data.urls.regular,
    envios,
  };

  return { historyEntry, enviados: envios.length };
}

module.exports = { sendImage, sendImageFromAPI };
