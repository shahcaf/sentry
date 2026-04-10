const mongoose = require('mongoose');

const warningSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        required: true,
    },
    moderatorId: {
        type: String,
        required: true,
    },
    reason: {
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

// Compound index for efficient queries
warningSchema.index({ guildId: 1, userId: 1 });

module.exports = mongoose.model('Warning', warningSchema);
