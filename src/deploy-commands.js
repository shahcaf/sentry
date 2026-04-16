/**
 * Slash Command Deployment Script
 * Run this to register all slash commands with Discord
 */

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];

// Load all command files
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);

console.log('[DEPLOY] Loading commands...');

for (const folder of commandFolders) {
    // Load commands from this folder

    const folderPath = path.join(commandsPath, folder);
    
    // Skip if not a directory
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

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.TOKEN);

// Deploy commands
(async () => {
    try {
        console.log(`[DEPLOY] Started refreshing ${commands.length} application (/) commands.`);

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, "1494002151654035598"),
            { body: commands },
        );

        console.log(`[DEPLOY] Successfully reloaded ${data.length} application (/) commands.`);
        console.log('[DEPLOY] Commands registered globally.');
    } catch (error) {
        console.error('[DEPLOY ERROR]', error);
    }
})();
