const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { Guild, Blacklist } = require('../../models');
const { errorEmbed, successEmbed, infoEmbed } = require('../../utils/embedBuilder');
const { checkCooldown } = require('../../utils/cooldown');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('security')
        .setDescription('Configure security features')
        .addSubcommand(subcommand =>
            subcommand.setName('antispam')
                .setDescription('Toggle anti-spam protection')
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Enable or disable anti-spam')
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('antilink')
                .setDescription('Toggle anti-link protection')
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Enable or disable anti-link')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('allowed')
                        .setDescription('Comma-separated list of allowed domains (e.g., discord.gg,youtube.com)')
                        .setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('antiraid')
                .setDescription('Toggle anti-raid protection')
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Enable or disable anti-raid')
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('blacklist')
                .setDescription('Blacklist a user from the server')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to blacklist')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for blacklisting')
                        .setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('unblacklist')
                .setDescription('Remove a user from the blacklist')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to unblacklist')
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('status')
                .setDescription('View security settings')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('whitelist')
                .setDescription('Manage whitelist (roles exempt from filters)')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to add/remove from whitelist')
                        .setRequired(true))
                .addBooleanOption(option =>
                    option.setName('add')
                        .setDescription('Add (true) or Remove (false) from whitelist')
                        .setRequired(true))
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    cooldown: 5,
    permission: 'Administrator',

    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'antispam':
                    await handleAntiSpam(interaction);
                    break;
                case 'antilink':
                    await handleAntiLink(interaction);
                    break;
                case 'antiraid':
                    await handleAntiRaid(interaction);
                    break;
                case 'blacklist':
                    await handleBlacklist(interaction);
                    break;
                case 'unblacklist':
                    await handleUnblacklist(interaction);
                    break;
                case 'status':
                    await handleStatus(interaction);
                    break;
                case 'whitelist':
                    await handleWhitelist(interaction);
                    break;
            }
        } catch (error) {
            console.error('[SECURITY COMMAND]', error);
            await interaction.reply({
                embeds: [errorEmbed('An error occurred while processing the security command.')],
                ephemeral: true,
            });
        }
    },
};

async function handleAntiSpam(interaction) {
    const enabled = interaction.options.getBoolean('enabled');

    await Guild.findOneAndUpdate(
        { guildId: interaction.guild.id },
        { antiSpamEnabled: enabled },
        { upsert: true, new: true }
    );

    const status = enabled ? 'enabled' : 'disabled';
    await interaction.reply({
        embeds: [successEmbed(`Anti-spam protection has been ${status}.`, 'Anti-Spam Updated')],
    });
}

async function handleAntiLink(interaction) {
    const enabled = interaction.options.getBoolean('enabled');
    const allowed = interaction.options.getString('allowed');

    const update = { antiLinkEnabled: enabled };
    if (allowed) {
        update.allowedLinks = allowed.split(',').map(d => d.trim().toLowerCase());
    }

    await Guild.findOneAndUpdate(
        { guildId: interaction.guild.id },
        update,
        { upsert: true, new: true }
    );

    const status = enabled ? 'enabled' : 'disabled';
    const message = allowed 
        ? `Anti-link protection ${status}. Allowed domains: ${allowed}`
        : `Anti-link protection has been ${status}.`;

    await interaction.reply({
        embeds: [successEmbed(message, 'Anti-Link Updated')],
    });
}

async function handleAntiRaid(interaction) {
    const enabled = interaction.options.getBoolean('enabled');

    await Guild.findOneAndUpdate(
        { guildId: interaction.guild.id },
        { antiRaidEnabled: enabled },
        { upsert: true, new: true }
    );

    const status = enabled ? 'enabled' : 'disabled';
    await interaction.reply({
        embeds: [successEmbed(`Anti-raid protection has been ${status}.`, 'Anti-Raid Updated')],
    });
}

async function handleBlacklist(interaction) {
    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (targetUser.id === interaction.user.id) {
        return interaction.reply({
            embeds: [errorEmbed('You cannot blacklist yourself!')],
            ephemeral: true,
        });
    }

    if (targetUser.id === interaction.guild.ownerId) {
        return interaction.reply({
            embeds: [errorEmbed('You cannot blacklist the server owner!')],
            ephemeral: true,
        });
    }

    const existing = await Blacklist.findOne({
        userId: targetUser.id,
        guildId: interaction.guild.id,
    });

    if (existing && existing.active) {
        return interaction.reply({
            embeds: [errorEmbed('This user is already blacklisted!')],
            ephemeral: true,
        });
    }

    // Create or update blacklist
    await Blacklist.findOneAndUpdate(
        { userId: targetUser.id, guildId: interaction.guild.id },
        {
            userId: targetUser.id,
            guildId: interaction.guild.id,
            reason,
            blacklistedBy: interaction.user.id,
            active: true,
        },
        { upsert: true, new: true }
    );

    // Try to kick/ban the user
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (targetMember) {
        try {
            await targetMember.kick(`Blacklisted: ${reason}`);
        } catch {
            // Failed to kick
        }
    }

    await interaction.reply({
        embeds: [successEmbed(`${targetUser.tag} has been blacklisted.\n**Reason:** ${reason}`, 'User Blacklisted')],
    });
}

async function handleUnblacklist(interaction) {
    const targetUser = interaction.options.getUser('user');

    const blacklist = await Blacklist.findOneAndUpdate(
        { userId: targetUser.id, guildId: interaction.guild.id, active: true },
        { active: false },
        { new: true }
    );

    if (!blacklist) {
        return interaction.reply({
            embeds: [errorEmbed('This user is not blacklisted!')],
            ephemeral: true,
        });
    }

    await interaction.reply({
        embeds: [successEmbed(`${targetUser.tag} has been removed from the blacklist.`, 'User Unblacklisted')],
    });
}

async function handleStatus(interaction) {
    const guildData = await Guild.findOne({ guildId: interaction.guild.id });

    if (!guildData) {
        return interaction.reply({
            embeds: [infoEmbed('Security features are not configured. Use the subcommands to configure them.')],
            ephemeral: true,
        });
    }

    const blacklistCount = await Blacklist.countDocuments({
        guildId: interaction.guild.id,
        active: true,
    });

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('🛡️ Security Settings')
        .addFields(
            { name: 'Anti-Spam', value: guildData.antiSpamEnabled ? '✅ Enabled' : '❌ Disabled', inline: true },
            { name: 'Anti-Link', value: guildData.antiLinkEnabled ? '✅ Enabled' : '❌ Disabled', inline: true },
            { name: 'Anti-Raid', value: guildData.antiRaidEnabled ? '✅ Enabled' : '❌ Disabled', inline: true },
            { name: 'Allowed Links', value: guildData.allowedLinks?.join(', ') || 'None', inline: false },
            { name: 'Whitelisted Roles', value: guildData.whitelistedRoles?.map(r => `<@&${r}>`).join(', ') || 'None', inline: false },
            { name: 'Blacklisted Users', value: `${blacklistCount} user(s)`, inline: true },
        )
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

async function handleWhitelist(interaction) {
    const role = interaction.options.getRole('role');
    const add = interaction.options.getBoolean('add');

    const guildData = await Guild.findOne({ guildId: interaction.guild.id });
    let whitelistedRoles = guildData?.whitelistedRoles || [];

    if (add) {
        if (whitelistedRoles.includes(role.id)) {
            return interaction.reply({
                embeds: [errorEmbed('This role is already whitelisted!')],
                ephemeral: true,
            });
        }
        whitelistedRoles.push(role.id);
    } else {
        whitelistedRoles = whitelistedRoles.filter(r => r !== role.id);
    }

    await Guild.findOneAndUpdate(
        { guildId: interaction.guild.id },
        { whitelistedRoles },
        { upsert: true, new: true }
    );

    const action = add ? 'added to' : 'removed from';
    await interaction.reply({
        embeds: [successEmbed(`${role.name} has been ${action} the whitelist.`, 'Whitelist Updated')],
    });
}
