// Quick start bot without deploying commands
require('dotenv').config({ path: '../.env' });

console.log('[START] Starting bot with TOKEN from parent .env');
console.log('[START] CLIENT_ID:', process.env.CLIENT_ID || 'Not set (bot will still work)');

// Start the bot directly
const { spawn } = require('child_process');
const bot = spawn('node', ['index.js'], { 
  stdio: 'inherit',
  cwd: __dirname 
});

bot.on('close', (code) => {
  console.log('[START] Bot stopped with code:', code);
});
