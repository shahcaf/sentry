const { Blacklist, Guild } = require('../models');

// Anti-spam storage
const spamCache = new Map();
const messageCache = new Map();

// Anti-raid storage
const joinCache = new Map();

/**
 * Check if user is blacklisted
 */
async function isBlacklisted(userId, guildId) {
    const blacklist = await Blacklist.findOne({
        userId,
        guildId,
        active: true,
    });
    return blacklist !== null;
}

/**
 * Add user to blacklist
 */
async function blacklistUser(userId, guildId, reason, moderatorId) {
    const existing = await Blacklist.findOne({ userId, guildId });
    
    if (existing) {
        existing.active = true;
        existing.reason = reason;
        existing.blacklistedBy = moderatorId;
        await existing.save();
        return existing;
    }

    return await Blacklist.create({
        userId,
        guildId,
        reason,
        blacklistedBy: moderatorId,
    });
}

/**
 * Remove user from blacklist
 */
async function unblacklistUser(userId, guildId) {
    const blacklist = await Blacklist.findOne({ userId, guildId });
    if (blacklist) {
        blacklist.active = false;
        await blacklist.save();
    }
    return blacklist;
}

/**
 * Check for spam (returns true if spamming)
 */
function checkSpam(userId, guildId, message, config = {}) {
    const key = `${userId}-${guildId}`;
    const now = Date.now();
    
    // Default config
    const maxMessages = config.maxMessages || 5;
    const timeWindow = config.timeWindow || 5000; // 5 seconds
    const muteDuration = config.muteDuration || 60000; // 1 minute

    if (!messageCache.has(key)) {
        messageCache.set(key, []);
    }

    const userMessages = messageCache.get(key);
    
    // Add current message
    userMessages.push({
        content: message.content,
        timestamp: now,
        id: message.id,
    });

    // Remove old messages outside time window
    const validMessages = userMessages.filter(msg => now - msg.timestamp < timeWindow);
    messageCache.set(key, validMessages);

    // Check if spamming
    if (validMessages.length >= maxMessages) {
        // Check for duplicate content (mass mention/copy-paste spam)
        const contentCounts = {};
        validMessages.forEach(msg => {
            const normalized = msg.content.toLowerCase().trim();
            contentCounts[normalized] = (contentCounts[normalized] || 0) + 1;
        });

        const isDuplicateSpam = Object.values(contentCounts).some(count => count >= 3);
        
        return {
            isSpamming: true,
            isDuplicateSpam,
            messageCount: validMessages.length,
            muteDuration,
        };
    }

    return { isSpamming: false };
}

/**
 * Clear spam cache for user
 */
function clearSpamCache(userId, guildId) {
    const key = `${userId}-${guildId}`;
    messageCache.delete(key);
    spamCache.delete(key);
}

/**
 * Check for links in message
 */
function containsLink(content) {
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/gi;
    return urlRegex.test(content);
}

/**
 * Check if link is allowed (discord.gg, etc.)
 */
function isAllowedLink(content, allowedDomains = []) {
    const discordInviteRegex = /(discord\.gg|discord\.com\/invite|discordapp\.com\/invite)/i;
    
    // Always block Discord invites unless explicitly allowed
    if (discordInviteRegex.test(content)) {
        return allowedDomains.some(domain => domain.toLowerCase() === 'discord.gg');
    }

    // Check other domains
    return allowedDomains.some(domain => content.toLowerCase().includes(domain.toLowerCase()));
}

/**
 * Check for anti-raid (mass joins)
 */
function checkAntiRaid(guildId, config = {}) {
    const key = guildId;
    const now = Date.now();
    
    const joinThreshold = config.joinThreshold || 10;
    const timeWindow = config.timeWindow || 10000; // 10 seconds

    if (!joinCache.has(key)) {
        joinCache.set(key, []);
    }

    const joins = joinCache.get(key);
    joins.push(now);

    // Remove old entries
    const validJoins = joins.filter(time => now - time < timeWindow);
    joinCache.set(key, validJoins);

    return {
        isRaid: validJoins.length >= joinThreshold,
        joinCount: validJoins.length,
    };
}

/**
 * Clear anti-raid cache
 */
function clearAntiRaidCache(guildId) {
    joinCache.delete(guildId);
}

/**
 * Get spam stats
 */
function getSpamStats(userId, guildId) {
    const key = `${userId}-${guildId}`;
    const messages = messageCache.get(key) || [];
    return {
        recentMessages: messages.length,
        lastMessageTime: messages.length > 0 ? messages[messages.length - 1].timestamp : null,
    };
}

/**
 * Check for suspicious account (new account, default avatar, etc.)
 */
function checkSuspiciousAccount(member) {
    const now = Date.now();
    const accountAge = now - member.user.createdTimestamp;
    const oneDay = 24 * 60 * 60 * 1000;
    
    const checks = {
        isNewAccount: accountAge < oneDay,
        hasDefaultAvatar: member.user.displayAvatarURL().includes('embed/avatars'),
        noNickname: !member.nickname,
        hasNumbers: /\d{4,}/.test(member.user.username),
    };

    // Calculate suspicion score
    let score = 0;
    if (checks.isNewAccount) score += 2;
    if (checks.hasDefaultAvatar) score += 1;
    if (checks.noNickname) score += 0.5;
    if (checks.hasNumbers) score += 0.5;

    return {
        ...checks,
        suspicionScore: score,
        isSuspicious: score >= 2,
    };
}

module.exports = {
    isBlacklisted,
    blacklistUser,
    unblacklistUser,
    checkSpam,
    clearSpamCache,
    containsLink,
    isAllowedLink,
    checkAntiRaid,
    clearAntiRaidCache,
    getSpamStats,
    checkSuspiciousAccount,
};
