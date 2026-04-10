const mongoose = require('mongoose');

const blacklistSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    guildId: {
        type: String,
        required: true,
    },
    reason: {
        type: String,
        default: 'No reason provided',
    },
    blacklistedBy: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    active: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

// Compound index to ensure unique blacklist entries
blacklistSchema.index({ userId: 1, guildId: 1 }, { unique: true });

module.exports = mongoose.model('Blacklist', blacklistSchema);
