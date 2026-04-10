const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const ms = require('ms');
const { logModeration } = require('../../utils/logger');
const { errorEmbed, successEmbed } = require('../../utils/embedBuilder');
const { checkCooldown } = require('../../utils/cooldown');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a user (mute them temporarily)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to timeout')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration of timeout (e.g., 1h, 30m, 1d)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the timeout')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    cooldown: 5,
    permission: 'ModerateMembers',

    async execute(interaction) {
        try {
            // Check cooldown
            const { onCooldown, remainingTime } = checkCooldown('timeout', interaction.user.id, this.cooldown);
            if (onCooldown) {
                return interaction.reply({
                    embeds: [errorEmbed(`Please wait ${remainingTime} seconds before using this command again.`)],
                    ephemeral: true,
                });
            }

            const targetUser = interaction.options.getUser('user');
            const duration = interaction.options.getString('duration');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            // Parse duration
            const durationMs = ms(duration);
            if (!durationMs) {
                return interaction.reply({
                    embeds: [errorEmbed('Invalid duration format. Use formats like: 1h, 30m, 1d, 7d')],
                    ephemeral: true,
                });
            }

            // Max timeout is 28 days in Discord
            const maxTimeout = 28 * 24 * 60 * 60 * 1000;
            if (durationMs > maxTimeout) {
                return interaction.reply({
                    embeds: [errorEmbed('Timeout duration cannot exceed 28 days!')],
                    ephemeral: true,
                });
            }

            // Check if user is trying to timeout themselves
            if (targetUser.id === interaction.user.id) {
                return interaction.reply({
                    embeds: [errorEmbed('You cannot timeout yourself!')],
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
                    embeds: [errorEmbed('I cannot timeout the server owner!')],
                    ephemeral: true,
                });
            }

            // Check role hierarchy
            if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
                return interaction.reply({
                    embeds: [errorEmbed('You cannot timeout a member with equal or higher role than you!')],
                    ephemeral: true,
                });
            }

            // Check if user is already timed out
            if (targetMember.isCommunicationDisabled()) {
                return interaction.reply({
                    embeds: [errorEmbed('This user is already timed out!')],
                    ephemeral: true,
                });
            }

            // Apply timeout
            await targetMember.timeout(durationMs, `${reason} - By ${interaction.user.tag}`);

            // Format duration for display
            const formattedDuration = ms(durationMs, { long: true });

            // Send confirmation
            const embed = successEmbed(
                `Successfully timed out ${targetUser.tag} (${targetUser.id})\n**Duration:** ${formattedDuration}\n**Reason:** ${reason}`,
                'User Timed Out'
            );

            await interaction.reply({ embeds: [embed] });

            // Log the action
            await logModeration(
                interaction.guild,
                'timeout',
                targetUser,
                interaction.user,
                reason,
                formattedDuration,
                interaction.client
            );

            // Try to DM the user
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(0xFFFF00)
                    .setTitle(`You have been timed out in ${interaction.guild.name}`)
                    .addFields(
                        { name: 'Duration', value: formattedDuration, inline: true },
                        { name: 'Moderator', value: interaction.user.tag, inline: true },
                        { name: 'Reason', value: reason, inline: false }
                    )
                    .setTimestamp();

                await targetUser.send({ embeds: [dmEmbed] });
            } catch {
                // User has DMs disabled
            }

        } catch (error) {
            console.error('[TIMEOUT COMMAND]', error);
            await interaction.reply({
                embeds: [errorEmbed('An error occurred while trying to timeout the user. Please check my permissions.')],
                ephemeral: true,
            });
        }
    },
};
