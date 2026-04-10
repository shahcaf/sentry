const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const { Guild } = require('../../models');
const { errorEmbed, successEmbed, infoEmbed } = require('../../utils/embedBuilder');
const { checkCooldown } = require('../../utils/cooldown');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('Manage welcome and leave messages')
        .addSubcommand(subcommand =>
            subcommand.setName('set')
                .setDescription('Set the welcome channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel for welcome messages')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Welcome message. Use: {user}, {username}, {server}, {count}')
                        .setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('setleave')
                .setDescription('Set the leave channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel for leave messages')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Leave message. Use: {user}, {username}, {server}, {count}')
                        .setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('toggle')
                .setDescription('Toggle welcome/leave messages')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Which message to toggle')
                        .addChoices(
                            { name: 'Welcome', value: 'welcome' },
                            { name: 'Leave', value: 'leave' }
                        )
                        .setRequired(true))
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Enable or disable')
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('test')
                .setDescription('Test welcome message')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('status')
                .setDescription('View current welcome settings')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    cooldown: 5,

    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'set':
                    await handleSetWelcome(interaction);
                    break;
                case 'setleave':
                    await handleSetLeave(interaction);
                    break;
                case 'toggle':
                    await handleToggle(interaction);
                    break;
                case 'test':
                    await handleTest(interaction);
                    break;
                case 'status':
                    await handleStatus(interaction);
                    break;
            }
        } catch (error) {
            console.error('[WELCOME COMMAND]', error);
            await interaction.reply({
                embeds: [errorEmbed('An error occurred while processing the welcome command.')],
                ephemeral: true,
            });
        }
    },
};

async function handleSetWelcome(interaction) {
    const channel = interaction.options.getChannel('channel');
    const message = interaction.options.getString('message') || 'Welcome {user} to {server}! You are our {count}th member!';

    await Guild.findOneAndUpdate(
        { guildId: interaction.guild.id },
        {
            welcomeChannel: channel.id,
            welcomeMessage: message,
            welcomeEnabled: true,
        },
        { upsert: true, new: true }
    );

    const embed = successEmbed(
        `Welcome messages will be sent to ${channel}\n**Message:** ${message}`,
        'Welcome Settings Updated'
    );

    await interaction.reply({ embeds: [embed] });
}

async function handleSetLeave(interaction) {
    const channel = interaction.options.getChannel('channel');
    const message = interaction.options.getString('message') || '{user} has left {server}. We now have {count} members.';

    await Guild.findOneAndUpdate(
        { guildId: interaction.guild.id },
        {
            leaveChannel: channel.id,
            leaveMessage: message,
            leaveEnabled: true,
        },
        { upsert: true, new: true }
    );

    const embed = successEmbed(
        `Leave messages will be sent to ${channel}\n**Message:** ${message}`,
        'Leave Settings Updated'
    );

    await interaction.reply({ embeds: [embed] });
}

async function handleToggle(interaction) {
    const type = interaction.options.getString('type');
    const enabled = interaction.options.getBoolean('enabled');

    const update = type === 'welcome' 
        ? { welcomeEnabled: enabled } 
        : { leaveEnabled: enabled };

    await Guild.findOneAndUpdate(
        { guildId: interaction.guild.id },
        update,
        { upsert: true, new: true }
    );

    const typeText = type === 'welcome' ? 'Welcome' : 'Leave';
    const status = enabled ? 'enabled' : 'disabled';

    const embed = successEmbed(`${typeText} messages have been ${status}.`, 'Settings Updated');
    await interaction.reply({ embeds: [embed] });
}

async function handleTest(interaction) {
    const guildData = await Guild.findOne({ guildId: interaction.guild.id });

    if (!guildData?.welcomeChannel || !guildData.welcomeEnabled) {
        return interaction.reply({
            embeds: [errorEmbed('Welcome system is not configured! Use `/welcome set` to configure it.')],
            ephemeral: true,
        });
    }

    const channel = await interaction.guild.channels.fetch(guildData.welcomeChannel).catch(() => null);
    if (!channel) {
        return interaction.reply({
            embeds: [errorEmbed('Welcome channel not found! Please reconfigure.')],
            ephemeral: true,
        });
    }

    // Replace placeholders
    const message = formatMessage(guildData.welcomeMessage, interaction.member, interaction.guild);

    const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('👋 Welcome!')
        .setDescription(message)
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `You are our ${interaction.guild.memberCount}th member!` })
        .setTimestamp();

    await channel.send({ embeds: [embed] });
    
    await interaction.reply({
        embeds: [successEmbed('Test welcome message sent!')],
        ephemeral: true,
    });
}

async function handleStatus(interaction) {
    const guildData = await Guild.findOne({ guildId: interaction.guild.id });

    if (!guildData) {
        return interaction.reply({
            embeds: [infoEmbed('Welcome system is not configured. Use `/welcome set` to get started.')],
            ephemeral: true,
        });
    }

    const welcomeChannel = guildData.welcomeChannel 
        ? `<#${guildData.welcomeChannel}>` 
        : 'Not set';
    
    const leaveChannel = guildData.leaveChannel 
        ? `<#${guildData.leaveChannel}>` 
        : 'Not set';

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('📊 Welcome System Status')
        .addFields(
            { name: '👋 Welcome', value: [
                `**Channel:** ${welcomeChannel}`,
                `**Enabled:** ${guildData.welcomeEnabled ? '✅' : '❌'}`,
                `**Message:** ${guildData.welcomeMessage || 'Default'}`,
            ].join('\n'), inline: false },

            { name: '👋 Leave', value: [
                `**Channel:** ${leaveChannel}`,
                `**Enabled:** ${guildData.leaveEnabled ? '✅' : '❌'}`,
                `**Message:** ${guildData.leaveMessage || 'Default'}`,
            ].join('\n'), inline: false },
        )
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

function formatMessage(template, member, guild) {
    return template
        .replace(/{user}/g, `<@${member.id}>`)
        .replace(/{username}/g, member.user.username)
        .replace(/{server}/g, guild.name)
        .replace(/{count}/g, guild.memberCount)
        .replace(/{tag}/g, member.user.tag);
}

module.exports.formatMessage = formatMessage;
