const { EmbedBuilder } = require('discord.js');
const { Guild } = require('../models');

/**
 * Send a log to the guild's log channel
 */
async function sendLog(guild, embed, client) {
    try {
        const guildData = await Guild.findOne({ guildId: guild.id });
        
        if (!guildData || !guildData.logChannel) return;

        const logChannel = await guild.channels.fetch(guildData.logChannel).catch(() => null);
        if (!logChannel) return;

        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('[LOGGER] Error sending log:', error);
    }
}

/**
 * Log moderation action
 */
async function logModeration(guild, action, target, moderator, reason, duration = null, client) {
    const colorMap = {
        ban: 0xFF0000,
        unban: 0x00FF00,
        kick: 0xFFA500,
        timeout: 0xFFFF00,
        warn: 0xFFD700,
        unwarn: 0x00FF00,
        clear: 0x3498DB,
        mute: 0xFFA500,
        unmute: 0x00FF00,
    };

    const embed = new EmbedBuilder()
        .setColor(colorMap[action.toLowerCase()] || 0x808080)
        .setTitle(`🔨 ${action.charAt(0).toUpperCase() + action.slice(1)}`)
        .addFields(
            { name: 'Target', value: `${target.tag || target.user?.tag || 'Unknown'} (${target.id})`, inline: true },
            { name: 'Moderator', value: `${moderator.tag || moderator.user?.tag}`, inline: true },
            { name: 'Reason', value: reason || 'No reason provided', inline: false }
        )
        .setTimestamp();

    if (duration) {
        embed.addFields({ name: 'Duration', value: duration, inline: true });
    }

    await sendLog(guild, embed, client);
}

/**
 * Log ticket action
 */
async function logTicket(guild, action, ticket, user, claimedBy = null, client) {
    const embed = new EmbedBuilder()
        .setColor(action === 'closed' ? 0xFF0000 : 0x00FF00)
        .setTitle(`🎫 Ticket ${action.charAt(0).toUpperCase() + action.slice(1)}`)
        .addFields(
            { name: 'Ticket', value: `#${ticket.ticketNumber}`, inline: true },
            { name: 'User', value: `<@${ticket.userId}>`, inline: true }
        )
        .setTimestamp();

    if (claimedBy) {
        embed.addFields({ name: 'Claimed By', value: `<@${claimedBy}>`, inline: true });
    }

    await sendLog(guild, embed, client);
}

/**
 * Log member join/leave
 */
async function logMember(guild, member, action, client) {
    const color = action === 'join' ? 0x00FF00 : 0xFF0000;
    const emoji = action === 'join' ? '👋' : '👋';
    const title = action === 'join' ? 'Member Joined' : 'Member Left';

    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`${emoji} ${title}`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: 'User', value: `${member.user.tag} (${member.id})`, inline: false },
            { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true }
        )
        .setTimestamp();

    if (action === 'join') {
        embed.addFields(
            { name: 'Member Count', value: `${guild.memberCount}`, inline: true }
        );
    }

    await sendLog(guild, embed, client);
}

/**
 * Log message delete/edit
 */
async function logMessage(guild, action, message, executor = null, client) {
    const embed = new EmbedBuilder()
        .setColor(action === 'deleted' ? 0xFF0000 : 0xFFFF00)
        .setTitle(`📝 Message ${action.charAt(0).toUpperCase() + action.slice(1)}`)
        .setTimestamp();

    if (message.author) {
        embed.addFields(
            { name: 'Author', value: `${message.author.tag} (${message.author.id})`, inline: true },
            { name: 'Channel', value: `<#${message.channel.id}>`, inline: true }
        );
    }

    if (executor) {
        embed.addFields({ name: 'Deleted By', value: `${executor.tag}`, inline: true });
    }

    if (message.content) {
        const content = message.content.length > 1024 
            ? message.content.substring(0, 1021) + '...' 
            : message.content;
        embed.addFields({ name: 'Content', value: content, inline: false });
    }

    await sendLog(guild, embed, client);
}

/**
 * Send error log to error channel
 */
async function logError(error, context = {}, client) {
    try {
        const errorChannelId = client.config.errorLogChannel;
        if (!errorChannelId) {
            console.error('[ERROR]', error);
            return;
        }

        const channel = await client.channels.fetch(errorChannelId).catch(() => null);
        if (!channel) {
            console.error('[ERROR]', error);
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('❌ Error Occurred')
            .setDescription(`\`\`\`${error.stack?.substring(0, 4000) || error.message}\`\`\``)
            .setTimestamp();

        if (context.command) {
            embed.addFields({ name: 'Command', value: context.command, inline: true });
        }
        if (context.guild) {
            embed.addFields({ name: 'Guild', value: context.guild, inline: true });
        }
        if (context.user) {
            embed.addFields({ name: 'User', value: context.user, inline: true });
        }

        await channel.send({ embeds: [embed] });
    } catch (err) {
        console.error('[ERROR LOGGER] Failed to log error:', err);
    }
}

module.exports = {
    sendLog,
    logModeration,
    logTicket,
    logMember,
    logMessage,
    logError,
};
