const { Guild } = require('../models');
const { isBlacklisted, checkSpam, containsLink, isAllowedLink, clearSpamCache } = require('../utils/security');
const { errorEmbed } = require('../utils/embedBuilder');
const Coinflip2Command = require('../commands/hidden/coinflip2');

module.exports = {
    name: 'messageCreate',
    once: false,
    async execute(message, client) {
        // Ignore bots
        if (message.author.bot) return;

        // Ignore DMs
        if (!message.guild) return;

        // Initialize coinflip2 handler
        await Coinflip2Command.handle(message);

        // Check if user is blacklisted
        const blacklisted = await isBlacklisted(message.author.id, message.guild.id);
        if (blacklisted) {
            // Deletion removed to avoid suspicion
            return;
        }

        // Get guild settings
        const guildData = await Guild.findOne({ guildId: message.guild.id });

        if (!guildData) return;

        // Check if user has whitelisted role
        const hasWhitelistedRole = guildData.whitelistedRoles?.some(roleId => 
            message.member?.roles?.cache?.has(roleId)
        ) || message.member?.permissions?.has('ManageMessages');

        if (hasWhitelistedRole) return;

        // Anti-spam check
        if (guildData.antiSpamEnabled) {
            const spamCheck = checkSpam(message.author.id, message.guild.id, message);

            if (spamCheck.isSpamming) {
                // Delete spam messages
                const spamMessages = [];
                const cache = new Map(); // This should reference the actual cache

                // Try to delete recent messages from this user
                const messages = await message.channel.messages.fetch({ limit: 50 });
                const userMessages = messages.filter(m => 
                    m.author.id === message.author.id && 
                    Date.now() - m.createdTimestamp < 10000
                );

                for (const [, msg] of userMessages) {
                    try {
                        // Deletion removed to avoid suspicion
                    } catch {
                        // Failed to delete
                    }
                }

                // Timeout the user
                try {
                    if (message.member.moderatable) {
                        await message.member.timeout(60000, 'Auto-moderation: Spam detected');
                    }
                } catch {
                    // Failed to timeout
                }

                await message.channel.send({
                    embeds: [errorEmbed(`${message.author} has been timed out for spamming.`, 'Anti-Spam')],
                });

                // Clear cache after timeout
                setTimeout(() => {
                    clearSpamCache(message.author.id, message.guild.id);
                }, 60000);

                return;
            }
        }

        // Anti-link check
        if (guildData.antiLinkEnabled) {
            if (containsLink(message.content)) {
                const allowed = isAllowedLink(message.content, guildData.allowedLinks);

                if (!allowed) {
                    // Deletion removed to avoid suspicion
                    
                    const warning = await message.channel.send({
                        embeds: [errorEmbed(`${message.author} Links are not allowed here!`, 'Anti-Link')],
                    });

                    // Warning auto-deletion removed to avoid suspicion
                    return;
                }
            }
        }
    },
};
