require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),

  // --- Users ---
  getUser: async (userId) => {
    const res = await pool.query('SELECT * FROM users WHERE user_id = $1', [userId]);
    return res.rows[0];
  },

  upsertUser: async (userId, verified, method) => {
    const query = `
      INSERT INTO users (user_id, verified, method)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id) 
      DO UPDATE SET verified = $2, method = $3;
    `;
    return pool.query(query, [userId, verified, method]);
  },

  // --- Servers ---
  getServer: async (serverId) => {
    const res = await pool.query('SELECT * FROM servers WHERE server_id = $1', [serverId]);
    return res.rows[0];
  },

  upsertServer: async (serverId, roleId, channelId, logChannelId, autoVerify, antiLink, settings = {}) => {
    const query = `
      INSERT INTO servers (server_id, role_id, channel_id, log_channel_id, auto_verify, anti_link, settings)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (server_id) 
      DO UPDATE SET role_id = $2, channel_id = $3, log_channel_id = $4, auto_verify = $5, anti_link = $6, settings = $7;
    `;
    return pool.query(query, [serverId, roleId, channelId, logChannelId, autoVerify, antiLink, JSON.stringify(settings)]);
  },

  // --- Blacklist ---
  isBlacklisted: async (userId) => {
    const res = await pool.query('SELECT * FROM blacklist WHERE user_id = $1', [userId]);
    return res.rows.length > 0;
  },

  blacklistUser: async (userId, reason) => {
    const query = `
      INSERT INTO blacklist (user_id, reason)
      VALUES ($1, $2)
      ON CONFLICT (user_id) 
      DO UPDATE SET reason = $2;
    `;
    return pool.query(query, [userId, reason]);
  },

  removeBlacklist: async (userId) => {
    return pool.query('DELETE FROM blacklist WHERE user_id = $1', [userId]);
  },

  // --- Logs ---
  addLog: async (event, userId, serverId) => {
    const query = `
      INSERT INTO logs (event, user_id, server_id)
      VALUES ($1, $2, $3);
    `;
    return pool.query(query, [event, userId, serverId]);
  },

  // --- Whitelist ---
  isWhitelisted: async (serverId, userId) => {
    const res = await pool.query('SELECT * FROM whitelist WHERE server_id = $1 AND user_id = $2', [serverId, userId]);
    return res.rows.length > 0;
  },

  addWhitelist: async (serverId, userId) => {
    const query = `
      INSERT INTO whitelist (server_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (server_id, user_id) DO NOTHING;
    `;
    return pool.query(query, [serverId, userId]);
  },

  removeWhitelist: async (serverId, userId) => {
    return pool.query('DELETE FROM whitelist WHERE server_id = $1 AND user_id = $2', [serverId, userId]);
  },

  getWhitelist: async (serverId) => {
    const res = await pool.query('SELECT user_id FROM whitelist WHERE server_id = $1', [serverId]);
    return res.rows.map(r => r.user_id);
  }
};
