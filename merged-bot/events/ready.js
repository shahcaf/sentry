module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`[BOT] ${client.user.tag} is now online!`);
    console.log(`[BOT] Serving ${client.guilds.cache.size} guild(s) and ${client.users.cache.size} user(s)`);
  },
};
