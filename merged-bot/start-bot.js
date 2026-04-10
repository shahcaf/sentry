// Simple bot starter that uses environment variables
require('dotenv').config({ path: '../.env' });

// Get CLIENT_ID from parent .env or use placeholder
if (!process.env.CLIENT_ID || process.env.CLIENT_ID === 'your_bot_client_id_here') {
  console.log('[START] CLIENT_ID not set or is placeholder. Please set it in your .env file');
  process.exit(1);
}

console.log('[START] Using TOKEN from parent .env');
console.log('[START] CLIENT_ID:', process.env.CLIENT_ID);

// Now run the actual deploy commands
const { spawn } = require('child_process');
const deploy = spawn('node', ['deploy-commands.js'], { 
  stdio: 'inherit',
  cwd: __dirname 
});

deploy.on('close', (code) => {
  if (code === 0) {
    console.log('[START] Commands deployed successfully!');
    console.log('[START] Starting bot...');
    
    // Start the actual bot
    const bot = spawn('node', ['index.js'], { 
      stdio: 'inherit',
      cwd: __dirname 
    });
  } else {
    console.log('[START] Deploy failed');
  }
});
