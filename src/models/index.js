/**
 * Database Models with fallback for no-database mode
 */

const mongoose = require('mongoose');

// In-memory storage for when database is not available
const memoryStore = {
    guilds: new Map(),
    warnings: [],
    tickets: [],
    blacklists: [],
};

// Check if database is connected
function isDbConnected() {
    return mongoose.connection.readyState === 1;
}

// Guild Model with fallback
const GuildModel = {
    async findOne(query) {
        if (isDbConnected()) {
            const Guild = require('./Guild');
            return await Guild.findOne(query);
        }
        // Return from memory or default
        const key = query.guildId;
        return memoryStore.guilds.get(key) || this.getDefaultGuild(key);
    },

    async findOneAndUpdate(query, update, options = {}) {
        if (isDbConnected()) {
            const Guild = require('./Guild');
            return await Guild.findOneAndUpdate(query, update, options);
        }
        
        const key = query.guildId;
        const existing = memoryStore.guilds.get(key) || this.getDefaultGuild(key);
        
        // Merge update (flatten nested updates)
        const flattened = flattenUpdate(update);
        const updated = { ...existing, ...flattened };
        
        memoryStore.guilds.set(key, updated);
        return options.new ? updated : existing;
    },

    async findOneAndDelete(query) {
        if (isDbConnected()) {
            const Guild = require('./Guild');
            return await Guild.findOneAndDelete(query);
        }
        const key = query.guildId;
        const existing = memoryStore.guilds.get(key);
        memoryStore.guilds.delete(key);
        return existing;
    },

    getDefaultGuild(guildId) {
        return {
            guildId,
            prefix: '!',
            welcomeChannel: null,
            welcomeMessage: 'Welcome {user} to {server}!',
            welcomeEnabled: false,
            leaveChannel: null,
            leaveMessage: '{user} has left {server}.',
            leaveEnabled: false,
            logChannel: null,
            ticketCategory: null,
            ticketLogChannel: null,
            ticketStaffRole: null,
            antiSpamEnabled: false,
            antiLinkEnabled: false,
            antiRaidEnabled: false,
            allowedLinks: [],
            whitelistedRoles: [],
            autoRole: null,
            reactionRoles: [],
        };
    },
};

// Warning Model with fallback
const WarningModel = {
    async create(data) {
        if (isDbConnected()) {
            const Warning = require('./Warning');
            return await Warning.create(data);
        }
        const warning = {
            _id: Date.now().toString(),
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        memoryStore.warnings.push(warning);
        return warning;
    },

    async find(query) {
        if (isDbConnected()) {
            const Warning = require('./Warning');
            return await Warning.find(query);
        }
        return memoryStore.warnings.filter(w => 
            (!query.guildId || w.guildId === query.guildId) &&
            (!query.userId || w.userId === query.userId) &&
            (query.active === undefined || w.active === query.active)
        );
    },

    async findOne(query) {
        if (isDbConnected()) {
            const Warning = require('./Warning');
            return await Warning.findOne(query);
        }
        return memoryStore.warnings.find(w => 
            (!query.guildId || w.guildId === query.guildId) &&
            (!query.userId || w.userId === query.userId) &&
            (!query._id || w._id === query._id)
        );
    },

    async countDocuments(query) {
        if (isDbConnected()) {
            const Warning = require('./Warning');
            return await Warning.countDocuments(query);
        }
        return memoryStore.warnings.filter(w => 
            (!query.guildId || w.guildId === query.guildId) &&
            (!query.userId || w.userId === query.userId) &&
            (query.active === undefined || w.active === query.active)
        ).length;
    },

    async save(warning) {
        if (isDbConnected()) {
            return await warning.save();
        }
        // In memory, already saved when created
        return warning;
    },
};

// Ticket Model with fallback
const TicketModel = {
    async create(data) {
        if (isDbConnected()) {
            const Ticket = require('./Ticket');
            return await Ticket.create(data);
        }
        const ticket = {
            _id: Date.now().toString(),
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        memoryStore.tickets.push(ticket);
        return ticket;
    },

    async findOne(query) {
        if (isDbConnected()) {
            const Ticket = require('./Ticket');
            return await Ticket.findOne(query);
        }
        return memoryStore.tickets.find(t =>
            (!query.guildId || t.guildId === query.guildId) &&
            (!query.channelId || t.channelId === query.channelId) &&
            (!query.userId || t.userId === query.userId) &&
            (query.status === undefined || t.status === query.status) &&
            (query.ticketNumber === undefined || t.ticketNumber === query.ticketNumber)
        );
    },

    async find(query) {
        if (isDbConnected()) {
            const Ticket = require('./Ticket');
            return await Ticket.find(query);
        }
        return memoryStore.tickets.filter(t =>
            (!query.guildId || t.guildId === query.guildId) &&
            (query.status === undefined || t.status === query.status)
        );
    },

    async countDocuments(query) {
        if (isDbConnected()) {
            const Ticket = require('./Ticket');
            return await Ticket.countDocuments(query);
        }
        return memoryStore.tickets.filter(t =>
            (!query.guildId || t.guildId === query.guildId)
        ).length;
    },

    async save(ticket) {
        if (isDbConnected()) {
            return await ticket.save();
        }
        // In memory, already saved
        return ticket;
    },
};

// Blacklist Model with fallback
const BlacklistModel = {
    async create(data) {
        if (isDbConnected()) {
            const Blacklist = require('./Blacklist');
            return await Blacklist.create(data);
        }
        const entry = {
            _id: Date.now().toString(),
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        memoryStore.blacklists.push(entry);
        return entry;
    },

    async findOne(query) {
        if (isDbConnected()) {
            const Blacklist = require('./Blacklist');
            return await Blacklist.findOne(query);
        }
        return memoryStore.blacklists.find(b =>
            (!query.userId || b.userId === query.userId) &&
            (!query.guildId || b.guildId === query.guildId) &&
            (query.active === undefined || b.active === query.active)
        );
    },

    async findOneAndUpdate(query, update, options = {}) {
        if (isDbConnected()) {
            const Blacklist = require('./Blacklist');
            return await Blacklist.findOneAndUpdate(query, update, options);
        }
        
        const index = memoryStore.blacklists.findIndex(b =>
            b.userId === query.userId && b.guildId === query.guildId
        );
        
        if (index !== -1) {
            const existing = memoryStore.blacklists[index];
            const flattened = flattenUpdate(update);
            const updated = { ...existing, ...flattened };
            memoryStore.blacklists[index] = updated;
            return options.new ? updated : existing;
        }
        
        return null;
    },

    async countDocuments(query) {
        if (isDbConnected()) {
            const Blacklist = require('./Blacklist');
            return await Blacklist.countDocuments(query);
        }
        return memoryStore.blacklists.filter(b =>
            (!query.guildId || b.guildId === query.guildId) &&
            (query.active === undefined || b.active === query.active)
        ).length;
    },
};

// Helper to flatten MongoDB-style update objects
function flattenUpdate(update) {
    const result = {};
    for (const [key, value] of Object.entries(update)) {
        if (key === '$set') {
            Object.assign(result, value);
        } else if (!key.startsWith('$')) {
            result[key] = value;
        }
    }
    return result;
}

module.exports = {
    Guild: GuildModel,
    Warning: WarningModel,
    Ticket: TicketModel,
    Blacklist: BlacklistModel,
    isDbConnected,
    memoryStore,
};
