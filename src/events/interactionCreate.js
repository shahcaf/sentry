const { InteractionType, Collection } = require('discord.js');
const { checkCooldown } = require('../utils/cooldown');
const { errorEmbed } = require('../utils/embedBuilder');
const { logError } = require('../utils/logger');
const { Ticket, Guild } = require('../models');

module.exports = {
    name: 'interactionCreate',
    once: false,
    async execute(interaction, client) {
        // Handle button interactions (tickets)
        if (interaction.isButton()) {
            await handleButtonInteraction(interaction, client);
            return;
        }

        // Handle slash commands
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`[COMMAND] No command matching ${interaction.commandName} was found.`);
            return;
        }

        // Check cooldown
        if (command.cooldown) {
            const { onCooldown, remainingTime } = checkCooldown(
                interaction.commandName,
                interaction.user.id,
                command.cooldown
            );

            if (onCooldown) {
                return interaction.reply({
                    embeds: [errorEmbed(`Please wait ${remainingTime} seconds before using this command again.`)],
                    ephemeral: true,
                });
            }
        }

        try {
            await command.execute(interaction, client);
        } catch (error) {
            console.error(`[COMMAND ERROR] ${interaction.commandName}:`, error);

            // Log error
            await logError(error, {
                command: interaction.commandName,
                guild: interaction.guild?.name,
                user: interaction.user.tag,
            }, client);

            const errorMessage = {
                embeds: [errorEmbed('There was an error while executing this command!')],
                ephemeral: true,
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    },
};

async function handleButtonInteraction(interaction, client) {
    const { customId } = interaction;

    // Handle ticket creation
    if (customId === 'create_ticket') {
        await createTicket(interaction, client);
    }
}

async function createTicket(interaction, client) {
    try {
        await interaction.deferReply({ ephemeral: true });

        const guildData = await Guild.findOne({ guildId: interaction.guild.id });

        if (!guildData?.ticketCategory) {
            return interaction.editReply({
                embeds: [errorEmbed('Ticket system is not configured. Please contact an administrator.')],
            });
        }

        // Check if user already has an open ticket
        const existingTicket = await Ticket.findOne({
            guildId: interaction.guild.id,
            userId: interaction.user.id,
            status: 'open',
        });

        if (existingTicket) {
            return interaction.editReply({
                embeds: [errorEmbed(`You already have an open ticket: <#${existingTicket.channelId}>`)],
            });
        }

        // Get ticket number
        const ticketCount = await Ticket.countDocuments({ guildId: interaction.guild.id }) + 1;

        // Create ticket channel
        const category = await interaction.guild.channels.fetch(guildData.ticketCategory).catch(() => null);
        
        if (!category) {
            return interaction.editReply({
                embeds: [errorEmbed('Ticket category not found. Please contact an administrator.')],
            });
        }

        const ticketChannel = await interaction.guild.channels.create({
            name: `ticket-${ticketCount}`,
            type: 0, // GUILD_TEXT
            parent: guildData.ticketCategory,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: ['ViewChannel'],
                },
                {
                    id: interaction.user.id,
                    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
                },
                {
                    id: client.user.id,
                    allow: ['ViewChannel', 'SendMessages', 'ManageChannels', 'ManageMessages'],
                },
            ],
        });

        // Add staff role permissions if set
        if (guildData.ticketStaffRole) {
            await ticketChannel.permissionOverwrites.create(guildData.ticketStaffRole, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true,
            });
        }

        // Save ticket to database
        const ticket = await Ticket.create({
            guildId: interaction.guild.id,
            channelId: ticketChannel.id,
            userId: interaction.user.id,
            ticketNumber: ticketCount,
            status: 'open',
        });

        // Send ticket info message
        const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`🎫 Ticket #${ticketCount}`)
            .setDescription(`Welcome <@${interaction.user.id}>!\n\nPlease describe your issue and a staff member will assist you shortly.`)
            .addFields(
                { name: 'Created', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
                { name: 'Status', value: '🟢 Open', inline: true }
            )
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('claim_ticket')
                .setLabel('Claim')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✋'),
            new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Close')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🔒')
        );

        await ticketChannel.send({
            content: `<@${interaction.user.id}>${guildData.ticketStaffRole ? ` | <@&${guildData.ticketStaffRole}>` : ''}`,
            embeds: [embed],
            components: [row],
        });

        await interaction.editReply({
            embeds: [{
                color: 0x00FF00,
                title: '✅ Ticket Created',
                description: `Your ticket has been created: <#${ticketChannel.id}>`,
            }],
        });

    } catch (error) {
        console.error('[TICKET CREATION]', error);
        await interaction.editReply({
            embeds: [errorEmbed('An error occurred while creating your ticket.')],
        });
    }
}
