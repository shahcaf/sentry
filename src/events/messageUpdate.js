const { Guild } = require('../models');
const { logMessage } = require('../utils/logger');

module.exports = {
    name: 'messageUpdate',
    once: false,
    async execute(oldMessage, newMessage, client) {
        try {
            // Ignore DMs and bot messages
            if (!newMessage.guild || newMessage.author?.bot) return;

            // Ignore if content hasn't changed
            if (oldMessage.content === newMessage.content) return;

            const guildData = await Guild.findOne({ guildId: newMessage.guild.id });

            if (!guildData?.logChannel) return;

            await logMessage(
                newMessage.guild,
                'edited',
                newMessage,
                null,
                client
            );
        } catch (error) {
            console.error('[MESSAGE UPDATE]', error);
        }
    },
};
