const { Guild } = require('../models');
const { EmbedBuilder } = require('discord.js');
const { logMember } = require('../utils/logger');

module.exports = {
    name: 'guildMemberRemove',
    once: false,
    async execute(member, client) {
        try {
            const guildData = await Guild.findOne({ guildId: member.guild.id });

            if (!guildData) return;

            // Log member leave
            if (guildData.logChannel) {
                await logMember(member.guild, member, 'leave', client);
            }

            // Send leave message
            if (guildData.leaveEnabled && guildData.leaveChannel) {
                const channel = await member.guild.channels.fetch(guildData.leaveChannel).catch(() => null);
                
                if (channel) {
                    const leaveMessage = formatMessage(
                        guildData.leaveMessage || '{user} has left {server}.',
                        member,
                        member.guild
                    );

                    const embed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('👋 Goodbye')
                        .setDescription(leaveMessage)
                        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                        .setFooter({ text: `We now have ${member.guild.memberCount} members` })
                        .setTimestamp();

                    await channel.send({ embeds: [embed] });
                }
            }

        } catch (error) {
            console.error('[GUILD MEMBER REMOVE]', error);
        }
    },
};

function formatMessage(template, member, guild) {
    return template
        .replace(/{user}/g, `<@${member.id}>`)
        .replace(/{username}/g, member.user.username)
        .replace(/{tag}/g, member.user.tag)
        .replace(/{server}/g, guild.name)
        .replace(/{count}/g, guild.memberCount)
        .replace(/{id}/g, member.id);
}
