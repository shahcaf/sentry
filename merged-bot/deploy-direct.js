// Direct deploy using parent .env
require('dotenv').config({ path: '../.env' });

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];

// Load all command files
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);

console.log('[DEPLOY] Loading commands...');

for (const folder of commandFolders) {
  const folderPath = path.join(commandsPath, folder);
  
  if (!fs.statSync(folderPath).isDirectory()) continue;

  const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(folderPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
      console.log(`[DEPLOY] Loaded: ${command.data.name}`);
    } else {
      console.log(`[DEPLOY] Skipped ${file}: missing required properties`);
    }
  }
}

// Check for required environment variables
if (!process.env.TOKEN) {
  console.error('[DEPLOY] ERROR: TOKEN not found in parent .env file');
  console.error('[DEPLOY] Please ensure your .env file contains: TOKEN=your_token_here');
  process.exit(1);
}

if (!process.env.CLIENT_ID) {
  console.error('[DEPLOY] ERROR: CLIENT_ID not found in parent .env file');
  console.error('[DEPLOY] Please set your actual Client ID from Discord Developer Portal');
  process.exit(1);
}

// Override with provided ID if it's placeholder
if (process.env.CLIENT_ID === 'your_bot_client_id_here') {
  process.env.CLIENT_ID = '1491778291911364662';
  console.log('[DEPLOY] Using provided Client ID: 1491778291911364662');
}

// Construct and prepare REST module
const rest = new REST().setToken(process.env.TOKEN);

// Deploy commands
(async () => {
  try {
    console.log(`[DEPLOY] Started refreshing ${commands.length} application (/) commands.`);
    console.log(`[DEPLOY] Using CLIENT_ID: ${process.env.CLIENT_ID}`);

    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );

    console.log(`[DEPLOY] Successfully reloaded ${data.length} application (/) commands.`);
    console.log('[DEPLOY] Commands registered globally.');
  } catch (error) {
    console.error('[DEPLOY ERROR]', error);
  }
})();
