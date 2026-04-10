const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Guild, Ticket } = require('../../models');
const { errorEmbed, successEmbed } = require('../../utils/embedBuilder');
const { checkCooldown } = require('../../utils/cooldown');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Ticket system management')
        .addSubcommand(subcommand =>
            subcommand.setName('setup')
                .setDescription('Setup the ticket system in this channel')
                .addChannelOption(option =>
                    option.setName('category')
                        .setDescription('Category for ticket channels')
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(false))
                .addRoleOption(option =>
                    option.setName('staff')
                        .setDescription('Staff role for ticket access')
                        .setRequired(false))
                .addChannelOption(option =>
                    option.setName('log_channel')
                        .setDescription('Channel for ticket logs')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('panel')
                .setDescription('Create a ticket panel in this channel')
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('Title for the panel')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Description for the panel')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('button_text')
                        .setDescription('Text for the button')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('color')
                        .setDescription('Embed color (hex)')
                        .setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('close')
                .setDescription('Close the current ticket')
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for closing')
                        .setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('claim')
                .setDescription('Claim the current ticket')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('add')
                .setDescription('Add a user to the ticket')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to add')
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('remove')
                .setDescription('Remove a user from the ticket')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to remove')
                        .setRequired(true))
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    cooldown: 5,

    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'setup':
                    await handleSetup(interaction);
                    break;
                case 'panel':
                    await handlePanel(interaction);
                    break;
                case 'close':
                    await handleClose(interaction);
                    break;
                case 'claim':
                    await handleClaim(interaction);
                    break;
                case 'add':
                    await handleAdd(interaction);
                    break;
                case 'remove':
                    await handleRemove(interaction);
                    break;
            }
        } catch (error) {
            console.error('[TICKET COMMAND]', error);
            await interaction.reply({
                embeds: [errorEmbed('An error occurred while processing the ticket command.')],
                ephemeral: true,
            });
        }
    },
};

async function handleSetup(interaction) {
    const category = interaction.options.getChannel('category');
    const staffRole = interaction.options.getRole('staff');
    const logChannel = interaction.options.getChannel('log_channel');

    await Guild.findOneAndUpdate(
        { guildId: interaction.guild.id },
        {
            ticketCategory: category?.id || null,
            ticketStaffRole: staffRole?.id || null,
            ticketLogChannel: logChannel?.id || null,
        },
        { upsert: true, new: true }
    );

    const embed = successEmbed(
        `Ticket system settings updated:\n${category ? `**Category:** <#${category.id}>` : ''}${staffRole ? `\n**Staff Role:** <@&${staffRole.id}>` : ''}${logChannel ? `\n**Log Channel:** <#${logChannel.id}>` : ''}`,
        'Ticket System Setup'
    );

    await interaction.reply({ embeds: [embed] });
}

async function handlePanel(interaction) {
    const title = interaction.options.getString('title') || '🎫 Support Tickets';
    const description = interaction.options.getString('description') || 'Click the button below to create a support ticket.';
    const buttonText = interaction.options.getString('button_text') || '📩 Create Ticket';
    const color = interaction.options.getString('color') || '#5865F2';

    // Convert hex to number
    const embedColor = parseInt(color.replace('#', ''), 16) || 0x5865F2;

    const embed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle(title)
        .setDescription(description)
        .setFooter({ text: 'Powered by Utility Bot' })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('create_ticket')
            .setLabel(buttonText)
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📩')
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({
        embeds: [successEmbed('Ticket panel created successfully!')],
        ephemeral: true,
    });
}

async function handleClose(interaction) {
    // Check if this is a ticket channel
    const ticket = await Ticket.findOne({
        channelId: interaction.channel.id,
        status: 'open',
    });

    if (!ticket) {
        return interaction.reply({
            embeds: [errorEmbed('This is not a ticket channel!')],
            ephemeral: true,
        });
    }

    const reason = interaction.options.getString('reason') || 'No reason provided';

    // Update ticket
    ticket.status = 'closed';
    ticket.closedBy = interaction.user.id;
    ticket.closeReason = reason;
    await ticket.save();

    // Send closure message
    const embed = successEmbed(
        `This ticket will be closed in 5 seconds...\n**Reason:** ${reason}\n**Closed by:** ${interaction.user.tag}`,
        'Ticket Closing'
    );

    await interaction.reply({ embeds: [embed] });

    // Delete channel after delay
    setTimeout(async () => {
        try {
            await interaction.channel.delete(`Ticket closed by ${interaction.user.tag}: ${reason}`);
        } catch (error) {
            console.error('[TICKET CLOSE]', error);
        }
    }, 5000);
}

async function handleClaim(interaction) {
    // Check if this is a ticket channel
    const ticket = await Ticket.findOne({
        channelId: interaction.channel.id,
        status: 'open',
    });

    if (!ticket) {
        return interaction.reply({
            embeds: [errorEmbed('This is not a ticket channel!')],
            ephemeral: true,
        });
    }

    // Check if already claimed
    if (ticket.claimedBy) {
        return interaction.reply({
            embeds: [errorEmbed(`This ticket is already claimed by <@${ticket.claimedBy}>!`)],
            ephemeral: true,
        });
    }

    // Check if user is staff
    const guildData = await Guild.findOne({ guildId: interaction.guild.id });
    if (guildData?.ticketStaffRole && !interaction.member.roles.cache.has(guildData.ticketStaffRole)) {
        return interaction.reply({
            embeds: [errorEmbed('Only staff members can claim tickets!')],
            ephemeral: true,
        });
    }

    // Claim ticket
    ticket.claimedBy = interaction.user.id;
    await ticket.save();

    // Update channel permissions to give claimer special access
    await interaction.channel.permissionOverwrites.edit(interaction.user.id, {
        ViewChannel: true,
        SendMessages: true,
        ManageMessages: true,
    });

    const embed = successEmbed(
        `This ticket has been claimed by ${interaction.user.tag}. They will be handling your request.`,
        'Ticket Claimed'
    );

    await interaction.reply({ embeds: [embed] });
}

async function handleAdd(interaction) {
    const user = interaction.options.getUser('user');

    // Check if this is a ticket channel
    const ticket = await Ticket.findOne({
        channelId: interaction.channel.id,
        status: 'open',
    });

    if (!ticket) {
        return interaction.reply({
            embeds: [errorEmbed('This is not a ticket channel!')],
            ephemeral: true,
        });
    }

    // Add user to channel
    await interaction.channel.permissionOverwrites.edit(user.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
    });

    const embed = successEmbed(`Added ${user.tag} to the ticket.`, 'User Added');
    await interaction.reply({ embeds: [embed] });
}

async function handleRemove(interaction) {
    const user = interaction.options.getUser('user');

    // Check if this is a ticket channel
    const ticket = await Ticket.findOne({
        channelId: interaction.channel.id,
        status: 'open',
    });

    if (!ticket) {
        return interaction.reply({
            embeds: [errorEmbed('This is not a ticket channel!')],
            ephemeral: true,
        });
    }

    // Remove user from channel
    await interaction.channel.permissionOverwrites.delete(user.id);

    const embed = successEmbed(`Removed ${user.tag} from the ticket.`, 'User Removed');
    await interaction.reply({ embeds: [embed] });
}
