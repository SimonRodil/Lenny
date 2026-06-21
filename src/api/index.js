const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { alertHistory, getBannedWords, addBannedWord, removeBannedWord, saveState } = require('../modules/automod');

function createAPI(client) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const config = require('../../config');
  const API_TOKEN = process.env.API_TOKEN || 'dash-secret-token';

  async function sendModLog(guild, action, targetId, reason, duration) {
    const channel = guild.channels.cache.get(config.channels.logsModeration);
    if (!channel) return;
    let description = `<@${targetId}> fue **${action}**`;
    if (reason) description += `\nRazón: \`${reason}\``;
    if (duration) description += `\nDuración: ${duration} min`;
    description += `\n\nAcción ejecutada desde el **Dashboard**.`;
    await channel.send({
      embeds: [{
        color: action === 'baneado' ? config.colors.error
             : action === 'expulsado' ? config.colors.warning
             : config.colors.primary,
        title: action === 'baneado' ? '🔨 Usuario baneado'
             : action === 'expulsado' ? '👢 Usuario expulsado'
             : '⏱️ Timeout aplicado',
        description,
        timestamp: new Date().toISOString(),
        footer: { text: `ID: ${targetId}` },
      }],
    }).catch(err => console.error('[API] Error al enviar log de moderación:', err.message));
  }

  function auth(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token !== API_TOKEN) return res.status(401).json({ error: 'No autorizado' });
    next();
  }

  app.use(auth);

  // GET /api/status
  app.get('/api/status', (req, res) => {
    res.json({
      status: client.user?.presence?.status || 'offline',
      ping: client.ws.ping,
      uptime: Math.floor(process.uptime()),
      startedAt: new Date(Date.now() - process.uptime() * 1000).toISOString(),
      guilds: client.guilds.cache.size,
      users: client.users.cache.size,
    });
  });

  // GET /api/channels
  app.get('/api/channels', (req, res) => {
    const guild = client.guilds.cache.first();
    if (!guild) return res.json([]);
    const channels = guild.channels.cache
      .filter(ch => ch.isTextBased() && ch.parentId)
      .map(ch => ({
        id: ch.id,
        name: ch.name,
        parentId: ch.parentId,
      }));
    res.json(channels);
  });

  // GET /api/automod/settings
  app.get('/api/automod/settings', (req, res) => {
    const cfg = require('../../config');
    res.json(cfg.features.automod);
  });

  // POST /api/automod/toggle
  app.post('/api/automod/toggle', (req, res) => {
    const { key, value } = req.body;
    const cfg = require('../../config');
    if (cfg.features.automod[key] === undefined) return res.status(400).json({ error: 'Key invalida' });
    cfg.features.automod[key] = value;
    saveState();
    res.json({ ok: true, [key]: value });
  });

  // GET /api/automod/wordlist
  app.get('/api/automod/wordlist', (req, res) => {
    res.json(getBannedWords());
  });

  // POST /api/automod/wordlist
  app.post('/api/automod/wordlist', (req, res) => {
    const { word, action } = req.body;
    if (!word || !action) return res.status(400).json({ error: 'word y action requeridos' });

    if (action === 'add') {
      const added = addBannedWord(word);
      return res.json({ ok: added, word });
    }

    if (action === 'remove') {
      const removed = removeBannedWord(word);
      return res.json({ ok: removed, word });
    }

    res.status(400).json({ error: 'action debe ser "add" o "remove"' });
  });

  // GET /api/automod/alerts
  app.get('/api/automod/alerts', (req, res) => {
    res.json(alertHistory.slice(0, 50));
  });

  // GET /api/members/search?q=
  app.get('/api/members/search', async (req, res) => {
    const q = (req.query.q || '').toLowerCase();
    const guild = client.guilds.cache.first();
    if (!guild) return res.json([]);
    const members = await guild.members.fetch();
    const results = members.filter(m => m.user.username.toLowerCase().includes(q) || m.id.includes(q)).map(m => ({
      id: m.id,
      username: m.user.username,
      discriminator: m.user.discriminator,
      joinedAt: m.joinedAt?.toISOString() || null,
      roles: m.roles.cache.map(r => r.name),
    })).slice(0, 20);
    res.json(results);
  });

  // GET /api/members/:id
  app.get('/api/members/:id', async (req, res) => {
    const guild = client.guilds.cache.first();
    if (!guild) return res.status(404).json({ error: 'No hay guild' });
    try {
      const m = await guild.members.fetch(req.params.id);
      res.json({
        id: m.id,
        username: m.user.username,
        discriminator: m.user.discriminator,
        joinedAt: m.joinedAt?.toISOString() || null,
        roles: m.roles.cache.map(r => ({ id: r.id, name: r.name })),
      });
    } catch {
      res.status(404).json({ error: 'Miembro no encontrado' });
    }
  });

  // POST /api/moderate/ban
  app.post('/api/moderate/ban', async (req, res) => {
    const { userId, reason } = req.body;
    const guild = client.guilds.cache.first();
    if (!guild) return res.status(400).json({ error: 'No hay guild' });
    try {
      await guild.members.ban(userId, { reason: reason || 'Dashboard' });
      await sendModLog(guild, 'baneado', userId, reason);
      res.json({ ok: true, message: 'Usuario baneado' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/moderate/kick
  app.post('/api/moderate/kick', async (req, res) => {
    const { userId, reason } = req.body;
    const guild = client.guilds.cache.first();
    if (!guild) return res.status(400).json({ error: 'No hay guild' });
    try {
      const m = await guild.members.fetch(userId);
      await m.kick(reason || 'Dashboard');
      await sendModLog(guild, 'expulsado', userId, reason);
      res.json({ ok: true, message: 'Usuario expulsado' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/moderate/timeout
  app.post('/api/moderate/timeout', async (req, res) => {
    const { userId, duration, reason } = req.body;
    const guild = client.guilds.cache.first();
    if (!guild) return res.status(400).json({ error: 'No hay guild' });
    try {
      const m = await guild.members.fetch(userId);
      await m.timeout((duration || 60) * 60 * 1000, reason || 'Dashboard');
      await sendModLog(guild, 'silenciado', userId, reason, duration || 60);
      res.json({ ok: true, message: 'Timeout aplicado por ' + (duration || 60) + ' min' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/send-message
  app.post('/api/send-message', async (req, res) => {
    const { channelId, content, imageUrl } = req.body;
    try {
      const ch = await client.channels.fetch(channelId);
      if (!ch) return res.status(404).json({ error: 'Canal no encontrado' });
      const msgOptions = {};
      if (content) msgOptions.content = content;
      if (imageUrl) msgOptions.embeds = [{ image: { url: imageUrl } }];
      if (!content && !imageUrl) return res.status(400).json({ error: 'content o imageUrl requerido' });
      await ch.send(msgOptions);
      res.json({ ok: true, message: 'Mensaje enviado' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/send-message/broadcast
  app.post('/api/send-message/broadcast', async (req, res) => {
    const { channelIds, content, imageUrl } = req.body;
    const results = [];
    for (const id of channelIds) {
      try {
        const ch = await client.channels.fetch(id);
        if (ch) {
          const msgOptions = {};
          if (content) msgOptions.content = content;
      if (imageUrl) msgOptions.embeds = [{ image: { url: imageUrl } }];
          if (content || imageUrl) await ch.send(msgOptions);
          results.push({ channelId: id, ok: true });
        }
      } catch {
        results.push({ channelId: id, ok: false });
      }
    }
    res.json({ ok: true, results });
  });

  // GET /api/wotd/history
  app.get('/api/wotd/history', (req, res) => {
    try {
      const data = fs.readFileSync(path.join(__dirname, '../../data/wotd-history.json'), 'utf8');
      const history = JSON.parse(data);
      return res.json(Array.isArray(history) ? history : []);
    } catch {
      return res.json([]);
    }
  });

  // POST /api/wotd/force
  app.post('/api/wotd/force', async (req, res) => {
    const command = client.commands.get('wotd');
    if (!command) return res.status(400).json({ error: 'Comando wotd no encontrado' });
    try {
      const guild = client.guilds.cache.first();
      if (!guild) return res.status(400).json({ error: 'No hay guild' });
      await command.execute({ client, guild, interaction: null });
      res.json({ ok: true, message: 'WOTD enviado' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return app;
}

module.exports = createAPI;
