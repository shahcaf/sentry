const { EmbedBuilder, Colors } = require('discord.js');

/**
 * Creates a standard embed with consistent styling
 */
function createEmbed(options = {}) {
    const embed = new EmbedBuilder();

    // Set color
    embed.setColor(options.color || Colors.Blue);

    // Set title
    if (options.title) embed.setTitle(options.title);

    // Set description
    if (options.description) embed.setDescription(options.description);

    // Set thumbnail
    if (options.thumbnail) embed.setThumbnail(options.thumbnail);

    // Set image
    if (options.image) embed.setImage(options.image);

    // Set author
    if (options.author) {
        embed.setAuthor({
            name: options.author.name,
            iconURL: options.author.icon,
            url: options.author.url,
        });
    }

    // Set footer
    if (options.footer) {
        embed.setFooter({
            text: options.footer.text || 'Discord Utility Bot',
            iconURL: options.footer.icon,
        });
    } else {
        embed.setFooter({
            text: 'Discord Utility Bot',
        });
    }

    // Set timestamp
    if (options.timestamp !== false) {
        embed.setTimestamp();
    }

    // Add fields
    if (options.fields && Array.isArray(options.fields)) {
        embed.addFields(options.fields);
    }

    return embed;
}

/**
 * Creates a success embed
 */
function successEmbed(description, title = 'Success') {
    return createEmbed({
        color: Colors.Green,
        title: `✅ ${title}`,
        description,
    });
}

/**
 * Creates an error embed
 */
function errorEmbed(description, title = 'Error') {
    return createEmbed({
        color: Colors.Red,
        title: `❌ ${title}`,
        description,
    });
}

/**
 * Creates a warning embed
 */
function warningEmbed(description, title = 'Warning') {
    return createEmbed({
        color: Colors.Yellow,
        title: `⚠️ ${title}`,
        description,
    });
}

/**
 * Creates an info embed
 */
function infoEmbed(description, title = 'Information') {
    return createEmbed({
        color: Colors.Blue,
        title: `ℹ️ ${title}`,
        description,
    });
}

/**
 * Creates a moderation log embed
 */
function modLogEmbed(action, target, moderator, reason, duration = null) {
    const fields = [
        { name: 'Target', value: `${target.tag} (${target.id})`, inline: true },
        { name: 'Moderator', value: `${moderator.tag}`, inline: true },
        { name: 'Reason', value: reason || 'No reason provided', inline: false },
    ];

    if (duration) {
        fields.push({ name: 'Duration', value: duration, inline: true });
    }

    const colorMap = {
        ban: Colors.Red,
        kick: Colors.Orange,
        timeout: Colors.Yellow,
        warn: Colors.Yellow,
        unban: Colors.Green,
        mute: Colors.Orange,
        unmute: Colors.Green,
    };

    return createEmbed({
        color: colorMap[action.toLowerCase()] || Colors.Grey,
        title: `🔨 ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        fields,
    });
}

module.exports = {
    createEmbed,
    successEmbed,
    errorEmbed,
    warningEmbed,
    infoEmbed,
    modLogEmbed,
};
