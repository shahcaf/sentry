const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logModeration } = require('../../utils/logger');
const { errorEmbed, successEmbed } = require('../../utils/embedBuilder');
const { checkCooldown } = require('../../utils/cooldown');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the kick')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    cooldown: 5,
    permission: 'KickMembers',

    async execute(interaction) {
        try {
            // Check cooldown
            const { onCooldown, remainingTime } = checkCooldown('kick', interaction.user.id, this.cooldown);
            if (onCooldown) {
                return interaction.reply({
                    embeds: [errorEmbed(`Please wait ${remainingTime} seconds before using this command again.`)],
                    ephemeral: true,
                });
            }

            const targetUser = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            // Check if user is trying to kick themselves
            if (targetUser.id === interaction.user.id) {
                return interaction.reply({
                    embeds: [errorEmbed('You cannot kick yourself!')],
                    ephemeral: true,
                });
            }

            // Check if user is trying to kick the bot
            if (targetUser.id === interaction.client.user.id) {
                return interaction.reply({
                    embeds: [errorEmbed('I cannot kick myself!')],
                    ephemeral: true,
                });
            }

            // Get member object
            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

            if (!targetMember) {
                return interaction.reply({
                    embeds: [errorEmbed('This user is not in the server!')],
                    ephemeral: true,
                });
            }

            // Check if target is owner
            if (targetMember.id === interaction.guild.ownerId) {
                return interaction.reply({
                    embeds: [errorEmbed('I cannot kick the server owner!')],
                    ephemeral: true,
                });
            }

            // Check role hierarchy
            if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
                return interaction.reply({
                    embeds: [errorEmbed('You cannot kick a member with equal or higher role than you!')],
                    ephemeral: true,
                });
            }

            // Try to DM the user before kicking
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(0xFFA500)
                    .setTitle(`You have been kicked from ${interaction.guild.name}`)
                    .addFields(
                        { name: 'Server', value: interaction.guild.name, inline: true },
                        { name: 'Moderator', value: interaction.user.tag, inline: true },
                        { name: 'Reason', value: reason, inline: false }
                    )
                    .setTimestamp();

                await targetUser.send({ embeds: [dmEmbed] });
            } catch {
                // User has DMs disabled
            }

            // Kick the user
            await targetMember.kick(`${reason} - Kicked by ${interaction.user.tag}`);

            // Send confirmation
            const embed = successEmbed(
                `Successfully kicked ${targetUser.tag} (${targetUser.id})\n**Reason:** ${reason}`,
                'User Kicked'
            );

            await interaction.reply({ embeds: [embed] });

            // Log the action
            await logModeration(
                interaction.guild,
                'kick',
                targetUser,
                interaction.user,
                reason,
                null,
                interaction.client
            );

        } catch (error) {
            console.error('[KICK COMMAND]', error);
            await interaction.reply({
                embeds: [errorEmbed('An error occurred while trying to kick the user. Please check my permissions.')],
                ephemeral: true,
            });
        }
    },
};
