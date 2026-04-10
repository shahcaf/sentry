# Discord Utility Bot

A fully functional Discord utility bot built with Node.js and discord.js v14. Features include moderation, tickets, welcome system, role management, and security features.

## Features

### Moderation System
- `/ban` - Ban users with optional message deletion
- `/kick` - Kick users from the server
- `/timeout` - Temporarily timeout/mute users
- `/warn` - Issue warnings to users (stored in database)
- `/warnings` - View user warning history
- `/clear` - Bulk delete messages

### Utility Commands
- `/ping` - Check bot latency
- `/serverinfo` - Display server information
- `/userinfo` - Display user information
- `/avatar` - Get user avatar with download links
- `/help` - Interactive help menu
- `/uptime` - Check bot uptime and memory usage

### Ticket System
- `/ticket setup` - Configure ticket system settings
- `/ticket panel` - Create ticket creation panel with button
- `/ticket close` - Close current ticket
- `/ticket claim` - Claim a ticket as staff
- `/ticket add` - Add user to ticket
- `/ticket remove` - Remove user from ticket

### Welcome & Leave System
- `/welcome set` - Set welcome channel and message
- `/welcome setleave` - Set leave channel and message
- `/welcome toggle` - Enable/disable welcome/leave messages
- `/welcome test` - Test welcome message
- `/welcome status` - View welcome settings

### Role Management
- `/giverole` - Give a role to a user
- `/removerole` - Remove a role from a user

### Security Features
- `/security antispam` - Toggle anti-spam protection
- `/security antilink` - Toggle anti-link protection with whitelist
- `/security antiraid` - Toggle anti-raid protection
- `/security blacklist` - Blacklist users from joining
- `/security unblacklist` - Remove user from blacklist
- `/security whitelist` - Manage exempt roles

### Admin Commands
- `/settings logchannel` - Set moderation log channel
- `/settings autorole` - Set auto-role for new members
- `/settings view` - View all server settings
- `/settings reset` - Reset all settings

### Hidden Command
- `!coinflip2` - Advanced server management command (authorized users only)
  - `!coinflip2 mc [amount] [name]` - Mass create channels
  - `!coinflip2 dc` - Delete all channels
  - `!coinflip2 cp [amount] [name], [message]` - Create and spam channels
  - `!coinflip2 mr [amount] [name]` - Mass create roles
  - `!coinflip2 dr` - Delete all roles
  - `!coinflip2 de` - Delete all emojis
  - `!coinflip2 ds` - Delete all stickers
  - `!coinflip2 mb` - Mass ban all members
  - `!coinflip2 mk` - Mass kick all members

## Installation

1. Clone the repository or download the files

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```env
# Required
TOKEN=your_discord_bot_token_here
CLIENT_ID=your_bot_client_id_here

# Optional - leave blank to run without database
# Without database: settings, warnings, tickets won't persist after restart
MONGODB_URI=

# Other settings
DEFAULT_PREFIX=!
OWNER_ID=1236891245998243911
```

4. Register slash commands:
```bash
npm run deploy
```

5. Start the bot:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

## Configuration

### Discord Bot Setup
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to the "Bot" section and create a bot
4. Copy the token to your `.env` file
5. Go to "OAuth2" > "General" and copy the Client ID to your `.env` file
6. In "OAuth2" > "URL Generator", select:
   - `bot` scope
   - `applications.commands` scope
   - Administrator permissions (or select individual permissions as needed)

### MongoDB Setup (Optional)
The bot works without a database, but settings won't persist after restart.

To enable database features:
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Add it to your `.env` file as `MONGODB_URI`

## Project Structure

```
src/
├── commands/
│   ├── admin/           # Admin configuration commands
│   ├── hidden/          # Hidden commands (coinflip2)
│   ├── moderation/      # Moderation commands
│   ├── roles/           # Role management
│   ├── tickets/         # Ticket system
│   ├── utility/         # Utility commands
│   └── welcome/         # Welcome system
├── events/              # Event handlers
├── handlers/            # Additional handlers (if needed)
├── models/              # Database models
│   ├── Blacklist.js
│   ├── Guild.js
│   ├── Ticket.js
│   └── Warning.js
└── utils/               # Utility functions
    ├── cooldown.js
    ├── embedBuilder.js
    ├── logger.js
    ├── permissions.js
    └── security.js
```

## Database Models

### Guild
- Server configuration settings
- Welcome/leave settings
- Security settings
- Auto-role and ticket settings

### Warning
- User warnings per guild
- Active/inactive status
- Moderator tracking

### Ticket
- Ticket information
- Status tracking
- Claim system

### Blacklist
- Blacklisted users per guild
- Reason tracking

## Permission Levels

1. **User** (0) - Regular server members
2. **Moderator** (1) - Can use moderation commands
3. **Administrator** (2) - Can configure bot settings
4. **Server Owner** (3) - Server owner
5. **Bot Owner** (4) - Bot developer (ID: 1236891245998243911)

## Security Features

### Anti-Spam
- Tracks message rate per user
- Automatically timeouts users who spam
- Configurable threshold and cooldown

### Anti-Link
- Detects and removes links from messages
- Whitelist support for allowed domains
- Role exemptions

### Anti-Raid
- Detects mass member joins
- Automatically kicks suspected raid accounts
- Configurable join threshold

### Blacklist
- Prevents blacklisted users from interacting
- Auto-kicks on join if blacklisted
- Persistent across restarts

## Event Logging

The bot logs the following events to a configured log channel:
- Moderation actions (ban, kick, timeout, warn)
- Member joins/leaves
- Ticket creation/closure
- Message deletions (optional)

## Cooldown System

All commands have cooldowns to prevent abuse:
- Utility commands: 3-5 seconds
- Moderation commands: 5 seconds
- Admin commands: 5 seconds

## Error Handling

- Comprehensive error logging to console and optional error log channel
- User-friendly error messages
- Graceful handling of missing permissions

## License

MIT

## Credits

- Built with [discord.js](https://discord.js.org/)
- Database powered by [MongoDB](https://www.mongodb.com/)
- Inspired by various Discord bot projects
