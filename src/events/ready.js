const { ActivityType } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`[BOT] ${client.user.tag} is now online!`);
        console.log(`[BOT] Serving ${client.guilds.cache.size} guild(s) and ${client.users.cache.size} user(s)`);

        // Set bot status
        client.user.setPresence({
            activities: [
                {
                    name: `/help | ${client.guilds.cache.size} servers`,
                    type: ActivityType.Listening,
                },
            ],
            status: 'online',
        });

        // Log startup info
        console.log('[BOT] Ready to serve!');
    },
};
