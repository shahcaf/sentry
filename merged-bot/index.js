require('dotenv').config();
const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const db = require('./utils/db');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
  ]
});

// Global collections
client.commands = new Collection();
client.cooldowns = new Collection();

// Load Commands
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

// Load Events
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

// coinflip2 Handler
const coinflip2 = require('./coinflip2-handler');
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  await coinflip2.execute(message, client);
});

// Database connection (optional for testing)
async function connectDatabase() {
  if (!process.env.DATABASE_URL) {
    console.log('[DATABASE] No DATABASE_URL provided - running without database');
    console.log('[DATABASE] SecurePass features will be limited');
    return;
  }
  
  try {
    await db.query('SELECT NOW()');
    console.log('[DATABASE] Connected to PostgreSQL successfully');
  } catch (error) {
    console.error('[DATABASE] Failed to connect:', error.message);
    console.log('[DATABASE] Continuing without database - some features will be limited');
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
  
  client.on('ready', () => {
    console.log(`[BOT] ${client.user.tag} is now online!`);
    console.log(`[BOT] Serving ${client.guilds.cache.size} guild(s) and ${client.users.cache.size} user(s)`);
    
    // Set bot status
    client.user.setPresence({
      activities: [
        {
          name: `/help | ${client.guilds.cache.size} servers`,
          type: ActivityType.Listening,
        },
      ],
      status: 'online',
    });
    
    console.log('[BOT] Ready to serve!');
  });
  
  await client.login(process.env.TOKEN);
}

init();

// Keep-alive HTTP server for Render
const http = require('http');
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('SecurePass + Utility Bot + coinflip2 is online.');
}).listen(PORT, () => {
  console.log(`[HTTP] Health server running on port ${PORT}`);
});
