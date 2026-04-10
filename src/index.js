/**
 * Discord Utility Bot
 * A fully functional utility bot with moderation, tickets, welcome system, and security features
 */

const { Client, GatewayIntentBits, Partials, Collection, PermissionsBitField } = require('discord.js');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
require('dotenv').config();

// Create client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildModeration,
    ],
    partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember, Partials.Reaction],
});

// Global collections
client.commands = new Collection();
client.cooldowns = new Collection();
client.aliases = new Collection();

// Anti-spam cache
client.spamCache = new Map();
client.antiRaid = new Map();

// Load configuration
client.config = {
    token: process.env.TOKEN,
    clientId: process.env.CLIENT_ID,
    mongodbUri: process.env.MONGODB_URI || null,
    ownerId: process.env.OWNER_ID || '1236891245998243911',
    defaultPrefix: process.env.DEFAULT_PREFIX || '!',
    logChannel: process.env.LOG_CHANNEL_ID,
    errorLogChannel: process.env.ERROR_LOG_CHANNEL_ID,
};

// Database connection state
client.dbConnected = false;

// Connect to MongoDB (optional)
async function connectDatabase() {
    if (!client.config.mongodbUri) {
        console.log('[DATABASE] No MongoDB URI provided, running without database');
        console.log('[DATABASE] Database features (warnings, tickets, settings) will be unavailable');
        return;
    }

    try {
        await mongoose.connect(client.config.mongodbUri);
        client.dbConnected = true;
        console.log('[DATABASE] Connected to MongoDB successfully');
    } catch (error) {
        console.error('[DATABASE] Failed to connect:', error.message);
        console.log('[DATABASE] Continuing without database - some features will be unavailable');
        client.dbConnected = false;
    }
}

// Load command files
function loadCommands() {
    const commandsPath = path.join(__dirname, 'commands');
    const commandFolders = fs.readdirSync(commandsPath);

    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);
        if (!fs.statSync(folderPath).isDirectory()) continue;

        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(folderPath, file);
            const command = require(filePath);

            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                console.log(`[COMMANDS] Loaded: ${command.data.name}`);
            } else {
                console.log(`[COMMANDS] Skipped ${file}: missing required properties`);
            }
        }
    }
}

// Load event files
function loadEvents() {
    const eventsPath = path.join(__dirname, 'events');
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);

        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
        console.log(`[EVENTS] Loaded: ${event.name}`);
    }
}

// Error handling
process.on('unhandledRejection', (error) => {
    console.error('[ERROR] Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('[ERROR] Uncaught Exception:', error);
});

// Initialize bot
async function init() {
    await connectDatabase();
    loadCommands();
    loadEvents();
    
    // Express server for Render health checks (fixes "no open ports" issue)
    const port = process.env.PORT || 10000;
    app.get('/', (req, res) => res.send('Bot is healthy and running!'));
    app.listen(port, () => console.log(`[SERVER] Health check server listening on port ${port}`));

    await client.login(client.config.token);
}

init();
