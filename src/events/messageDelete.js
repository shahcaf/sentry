const { Guild } = require('../models');
const { logMessage } = require('../utils/logger');

module.exports = {
    name: 'messageDelete',
    once: false,
    async execute(message, client) {
        try {
            // Ignore DMs and bot messages
            if (!message.guild || message.author?.bot) return;

            const guildData = await Guild.findOne({ guildId: message.guild.id });

            if (!guildData?.logChannel) return;

            // Don't log message deletions from the bot itself
            if (message.author?.id === client.user.id) return;

            await logMessage(
                message.guild,
                'deleted',
                message,
                null,
                client
            );
        } catch (error) {
            console.error('[MESSAGE DELETE]', error);
        }
    },
};
