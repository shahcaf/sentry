const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const { Guild } = require('../../models');
const { errorEmbed, successEmbed, infoEmbed } = require('../../utils/embedBuilder');
const { checkCooldown } = require('../../utils/cooldown');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('Configure bot settings for this server')
        .addSubcommand(subcommand =>
            subcommand.setName('logchannel')
                .setDescription('Set the moderation log channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel for moderation logs')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('autorole')
                .setDescription('Set the auto-role for new members')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to give to new members')
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('view')
                .setDescription('View current settings')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('reset')
                .setDescription('Reset all settings to default')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    cooldown: 5,
    permission: 'Administrator',

    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'logchannel':
                    await handleLogChannel(interaction);
                    break;
                case 'autorole':
                    await handleAutoRole(interaction);
                    break;
                case 'view':
                    await handleView(interaction);
                    break;
                case 'reset':
                    await handleReset(interaction);
                    break;
            }
        } catch (error) {
            console.error('[SETTINGS COMMAND]', error);
            await interaction.reply({
                embeds: [errorEmbed('An error occurred while processing the settings command.')],
                ephemeral: true,
            });
        }
    },
};

async function handleLogChannel(interaction) {
    const channel = interaction.options.getChannel('channel');

    // Check bot permissions
    const botMember = interaction.guild.members.me;
    const hasPermission = botMember.permissionsIn(channel).has(['SendMessages', 'EmbedLinks', 'ViewChannel']);

    if (!hasPermission) {
        return interaction.reply({
            embeds: [errorEmbed('I do not have permission to send messages in that channel!')],
            ephemeral: true,
        });
    }

    await Guild.findOneAndUpdate(
        { guildId: interaction.guild.id },
        { logChannel: channel.id },
        { upsert: true, new: true }
    );

    await interaction.reply({
        embeds: [successEmbed(`Moderation logs will now be sent to ${channel}.`, 'Log Channel Set')],
    });
}

async function handleAutoRole(interaction) {
    const role = interaction.options.getRole('role');

    // Check role hierarchy
    if (role.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.reply({
            embeds: [errorEmbed('I cannot assign a role that is higher than or equal to my highest role!')],
            ephemeral: true,
        });
    }

    if (role.managed) {
        return interaction.reply({
            embeds: [errorEmbed('I cannot assign managed/bot integration roles!')],
            ephemeral: true,
        });
    }

    await Guild.findOneAndUpdate(
        { guildId: interaction.guild.id },
        { autoRole: role.id },
        { upsert: true, new: true }
    );

    await interaction.reply({
        embeds: [successEmbed(`New members will now receive the ${role.name} role.`, 'Auto-Role Set')],
    });
}

async function handleView(interaction) {
    const guildData = await Guild.findOne({ guildId: interaction.guild.id });

    if (!guildData) {
        return interaction.reply({
            embeds: [infoEmbed('No custom settings configured for this server. Use the settings commands to configure.')],
            ephemeral: true,
        });
    }

    const logChannel = guildData.logChannel ? `<#${guildData.logChannel}>` : 'Not set';
    const autoRole = guildData.autoRole ? `<@&${guildData.autoRole}>` : 'Not set';
    const welcomeChannel = guildData.welcomeChannel ? `<#${guildData.welcomeChannel}>` : 'Not set';
    const leaveChannel = guildData.leaveChannel ? `<#${guildData.leaveChannel}>` : 'Not set';
    const ticketCategory = guildData.ticketCategory ? `<#${guildData.ticketCategory}>` : 'Not set';

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('⚙️ Server Settings')
        .addFields(
            { name: '🔧 General', value: [
                `**Log Channel:** ${logChannel}`,
                `**Auto Role:** ${autoRole}`,
            ].join('\n'), inline: false },

            { name: '👋 Welcome/Leave', value: [
                `**Welcome Channel:** ${welcomeChannel}`,
                `**Welcome Enabled:** ${guildData.welcomeEnabled ? '✅' : '❌'}`,
                `**Leave Channel:** ${leaveChannel}`,
                `**Leave Enabled:** ${guildData.leaveEnabled ? '✅' : '❌'}`,
            ].join('\n'), inline: false },

            { name: '🎫 Tickets', value: [
                `**Category:** ${ticketCategory}`,
                `**Staff Role:** ${guildData.ticketStaffRole ? `<@&${guildData.ticketStaffRole}>` : 'Not set'}`,
            ].join('\n'), inline: false },

            { name: '🛡️ Security', value: [
                `**Anti-Spam:** ${guildData.antiSpamEnabled ? '✅' : '❌'}`,
                `**Anti-Link:** ${guildData.antiLinkEnabled ? '✅' : '❌'}`,
                `**Anti-Raid:** ${guildData.antiRaidEnabled ? '✅' : '❌'}`,
            ].join('\n'), inline: false },
        )
        .setFooter({ text: `Guild ID: ${interaction.guild.id}` })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

async function handleReset(interaction) {
    // Delete guild settings
    await Guild.findOneAndDelete({ guildId: interaction.guild.id });

    await interaction.reply({
        embeds: [successEmbed('All server settings have been reset to default.', 'Settings Reset')],
    });
}
