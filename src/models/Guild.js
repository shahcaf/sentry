const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        unique: true,
    },
    prefix: {
        type: String,
        default: '!',
    },
    // Welcome System
    welcomeChannel: {
        type: String,
        default: null,
    },
    welcomeMessage: {
        type: String,
        default: 'Welcome {user} to {server}!',
    },
    welcomeEnabled: {
        type: Boolean,
        default: false,
    },
    // Leave System
    leaveChannel: {
        type: String,
        default: null,
    },
    leaveMessage: {
        type: String,
        default: '{user} has left {server}.',
    },
    leaveEnabled: {
        type: Boolean,
        default: false,
    },
    // Log Channel
    logChannel: {
        type: String,
        default: null,
    },
    // Ticket System
    ticketCategory: {
        type: String,
        default: null,
    },
    ticketLogChannel: {
        type: String,
        default: null,
    },
    ticketStaffRole: {
        type: String,
        default: null,
    },
    // Security Settings
    antiSpamEnabled: {
        type: Boolean,
        default: false,
    },
    antiLinkEnabled: {
        type: Boolean,
        default: false,
    },
    antiRaidEnabled: {
        type: Boolean,
        default: false,
    },
    allowedLinks: {
        type: [String],
        default: [],
    },
    whitelistedRoles: {
        type: [String],
        default: [],
    },
    // Auto Role
    autoRole: {
        type: String,
        default: null,
    },
    // Reaction Roles
    reactionRoles: [{
        messageId: String,
        emoji: String,
        roleId: String,
    }],
}, {
    timestamps: true,
});

module.exports = mongoose.model('Guild', guildSchema);
