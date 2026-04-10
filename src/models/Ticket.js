const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
    },
    channelId: {
        type: String,
        required: true,
        unique: true,
    },
    userId: {
        type: String,
        required: true,
    },
    ticketNumber: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['open', 'closed'],
        default: 'open',
    },
    claimedBy: {
        type: String,
        default: null,
    },
    closedBy: {
        type: String,
        default: null,
    },
    closeReason: {
        type: String,
        default: null,
    },
    messages: [{
        author: String,
        content: String,
        timestamp: Date,
    }],
}, {
    timestamps: true,
});

ticketSchema.index({ guildId: 1, status: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
