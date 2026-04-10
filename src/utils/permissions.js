const { PermissionFlagsBits, PermissionsBitField } = require('discord.js');

/**
 * Permission levels for the bot
 */
const PermissionLevels = {
    USER: 0,
    MODERATOR: 1,
    ADMINISTRATOR: 2,
    OWNER: 3,
    BOT_OWNER: 4,
};

/**
 * Check if user has required permission level
 */
async function checkPermissionLevel(member, guild, botOwnerId) {
    // Bot owner has highest permission
    if (member.id === botOwnerId) {
        return PermissionLevels.BOT_OWNER;
    }

    // Guild owner
    if (member.id === guild.ownerId) {
        return PermissionLevels.OWNER;
    }

    // Check administrator permission
    if (member.permissions.has(PermissionFlagsBits.Administrator)) {
        return PermissionLevels.ADMINISTRATOR;
    }

    // Check moderator permissions
    const modPermissions = [
        PermissionFlagsBits.KickMembers,
        PermissionFlagsBits.BanMembers,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.ModerateMembers,
    ];

    const hasModPerms = modPermissions.some(perm => member.permissions.has(perm));
    if (hasModPerms) {
        return PermissionLevels.MODERATOR;
    }

    return PermissionLevels.USER;
}

/**
 * Check if member meets required permission level
 */
async function hasPermissionLevel(member, guild, botOwnerId, requiredLevel) {
    const userLevel = await checkPermissionLevel(member, guild, botOwnerId);
    return userLevel >= requiredLevel;
}

/**
 * Permission level names for display
 */
const PermissionLevelNames = {
    [PermissionLevels.USER]: 'User',
    [PermissionLevels.MODERATOR]: 'Moderator',
    [PermissionLevels.ADMINISTRATOR]: 'Administrator',
    [PermissionLevels.OWNER]: 'Server Owner',
    [PermissionLevels.BOT_OWNER]: 'Bot Owner',
};

/**
 * Check bot permissions in a channel
 */
async function checkBotPermissions(channel, requiredPermissions) {
    const botMember = await channel.guild.members.fetch(channel.client.user.id);
    const missingPermissions = [];

    for (const permission of requiredPermissions) {
        if (!botMember.permissionsIn(channel).has(permission)) {
            missingPermissions.push(permission);
        }
    }

    return {
        hasPermissions: missingPermissions.length === 0,
        missing: missingPermissions,
    };
}

/**
 * Format permission flag to readable string
 */
function formatPermission(permission) {
    return permission
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
}

/**
 * Required permissions for moderation commands
 */
const ModerationPermissions = {
    ban: [PermissionFlagsBits.BanMembers],
    kick: [PermissionFlagsBits.KickMembers],
    timeout: [PermissionFlagsBits.ModerateMembers],
    warn: [PermissionFlagsBits.KickMembers],
    clear: [PermissionFlagsBits.ManageMessages],
    giverole: [PermissionFlagsBits.ManageRoles],
    removerole: [PermissionFlagsBits.ManageRoles],
};

module.exports = {
    PermissionLevels,
    PermissionLevelNames,
    checkPermissionLevel,
    hasPermissionLevel,
    checkBotPermissions,
    formatPermission,
    ModerationPermissions,
};
