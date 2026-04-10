const db = require('../utils/db');

module.exports = {
  name: 'messageCreate',
  once: false,
  async execute(message, client) {
    // Ignore bots and DMs
    if (message.author.bot || !message.guild) return;

    // Anti-link protection
    const serverConfig = await db.getServer(message.guild.id);
    if (serverConfig && serverConfig.anti_link) {
      const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/gi;
      
      if (urlRegex.test(message.content)) {
        // Check if user is admin or has whitelist
        const member = await message.guild.members.fetch(message.author.id).catch(() => null);
        if (!member || (!member.permissions.has('Administrator') && !(await db.isWhitelisted(message.guild.id, message.author.id)))) {
          await message.delete().catch(() => {});
          const warning = await message.channel.send({
            embeds: [{ 
              color: 0xFF0000, 
              title: ' Link Blocked', 
              description: `${message.author} Links are not allowed here!` 
            }]
          });
          setTimeout(() => warning.delete().catch(() => {}), 5000);
          return;
        }
      }
    }

    // Check for blacklisted users
    const isBlacklisted = await db.isBlacklisted(message.author.id);
    if (isBlacklisted) {
      await message.delete().catch(() => {});
      return;
    }
  },
};
