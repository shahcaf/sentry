const { Guild } = require('../models');
const { EmbedBuilder } = require('discord.js');
const { logMember } = require('../utils/logger');
const { checkAntiRaid, checkSuspiciousAccount } = require('../utils/security');

module.exports = {
    name: 'guildMemberAdd',
    once: false,
    async execute(member, client) {
        try {
            const guildData = await Guild.findOne({ guildId: member.guild.id });

            if (!guildData) return;

            // Check for anti-raid
            if (guildData.antiRaidEnabled) {
                const raidCheck = checkAntiRaid(member.guild.id);

                if (raidCheck.isRaid) {
                    // Kick the new member if raid detected
                    if (member.kickable) {
                        await member.kick('Anti-raid protection triggered');
                    }
                    return;
                }
            }

            // Check for suspicious account
            const suspicious = checkSuspiciousAccount(member);

            // Log member join
            if (guildData.logChannel) {
                await logMember(member.guild, member, 'join', client);
            }

            // Send welcome message
            if (guildData.welcomeEnabled && guildData.welcomeChannel) {
                const channel = await member.guild.channels.fetch(guildData.welcomeChannel).catch(() => null);
                
                if (channel) {
                    const welcomeMessage = formatMessage(
                        guildData.welcomeMessage || 'Welcome {user} to {server}!',
                        member,
                        member.guild
                    );

                    const embed = new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle('👋 Welcome!')
                        .setDescription(welcomeMessage)
                        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                        .setFooter({ text: `Member #${member.guild.memberCount}` })
                        .setTimestamp();

                    if (suspicious.isSuspicious) {
                        embed.addFields({
                            name: '⚠️ Suspicious Account',
                            value: 'This account may be an alt (new account, default avatar, etc.)',
                            inline: false,
                        });
                    }

                    await channel.send({ embeds: [embed] });
                }
            }

            // Give auto-role
            if (guildData.autoRole) {
                const role = await member.guild.roles.fetch(guildData.autoRole).catch(() => null);
                if (role) {
                    try {
                        await member.roles.add(role, 'Auto-role');
                    } catch (error) {
                        console.error('[AUTO-ROLE] Failed to add role:', error);
                    }
                }
            }

        } catch (error) {
            console.error('[GUILD MEMBER ADD]', error);
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
