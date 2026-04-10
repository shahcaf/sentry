const { Collection } = require('discord.js');

// Store cooldowns
const cooldowns = new Collection();

/**
 * Check if a user is on cooldown for a command
 * @param {string} commandName - The command name
 * @param {string} userId - The user ID
 * @param {number} cooldownAmount - Cooldown time in seconds
 * @returns {Object} - { onCooldown: boolean, remainingTime: number }
 */
function checkCooldown(commandName, userId, cooldownAmount) {
    const key = `${commandName}-${userId}`;
    const now = Date.now();
    const cooldownKey = cooldowns.get(key);

    if (cooldownKey) {
        const expirationTime = cooldownKey + (cooldownAmount * 1000);

        if (now < expirationTime) {
            const remainingTime = Math.ceil((expirationTime - now) / 1000);
            return { onCooldown: true, remainingTime };
        }
    }

    // Set cooldown
    cooldowns.set(key, now);

    // Auto-delete after cooldown expires
    setTimeout(() => {
        cooldowns.delete(key);
    }, cooldownAmount * 1000);

    return { onCooldown: false, remainingTime: 0 };
}

/**
 * Clear cooldown for a specific user and command
 */
function clearCooldown(commandName, userId) {
    const key = `${commandName}-${userId}`;
    return cooldowns.delete(key);
}

/**
 * Clear all cooldowns for a command
 */
function clearCommandCooldowns(commandName) {
    let deleted = 0;
    for (const [key, value] of cooldowns.entries()) {
        if (key.startsWith(`${commandName}-`)) {
            cooldowns.delete(key);
            deleted++;
        }
    }
    return deleted;
}

/**
 * Get remaining cooldown time
 */
function getRemainingTime(commandName, userId) {
    const key = `${commandName}-${userId}`;
    const cooldownKey = cooldowns.get(key);

    if (!cooldownKey) return 0;

    const now = Date.now();
    const expirationTime = cooldownKey;
    const remaining = Math.ceil((expirationTime - now) / 1000);

    return remaining > 0 ? remaining : 0;
}

module.exports = {
    checkCooldown,
    clearCooldown,
    clearCommandCooldowns,
    getRemainingTime,
    cooldowns,
};
