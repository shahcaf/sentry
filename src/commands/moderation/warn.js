const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { Warning } = require('../../models');
const { logModeration } = require('../../utils/logger');
const { errorEmbed, successEmbed } = require('../../utils/embedBuilder');
const { checkCooldown } = require('../../utils/cooldown');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the warning')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    cooldown: 3,
    permission: 'KickMembers',

    async execute(interaction) {
        try {
            // Check cooldown
            const { onCooldown, remainingTime } = checkCooldown('warn', interaction.user.id, this.cooldown);
            if (onCooldown) {
                return interaction.reply({
                    embeds: [errorEmbed(`Please wait ${remainingTime} seconds before using this command again.`)],
                    ephemeral: true,
                });
            }

            const targetUser = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            // Check if user is trying to warn themselves
            if (targetUser.id === interaction.user.id) {
                return interaction.reply({
                    embeds: [errorEmbed('You cannot warn yourself!')],
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

            // Check role hierarchy
            if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
                return interaction.reply({
                    embeds: [errorEmbed('You cannot warn a member with equal or higher role than you!')],
                    ephemeral: true,
                });
            }

            // Create warning in database
            const warning = await Warning.create({
                guildId: interaction.guild.id,
                userId: targetUser.id,
                moderatorId: interaction.user.id,
                reason,
            });

            // Count total warnings
            const warningCount = await Warning.countDocuments({
                guildId: interaction.guild.id,
                userId: targetUser.id,
                active: true,
            });

            // Send confirmation
            const embed = successEmbed(
                `Successfully warned ${targetUser.tag} (${targetUser.id})\n**Reason:** ${reason}\n**Total Warnings:** ${warningCount}`,
                'User Warned'
            );

            await interaction.reply({ embeds: [embed] });

            // Log the action
            await logModeration(
                interaction.guild,
                'warn',
                targetUser,
                interaction.user,
                reason,
                null,
                interaction.client
            );

            // Try to DM the user
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(0xFFD700)
                    .setTitle(`You have been warned in ${interaction.guild.name}`)
                    .addFields(
                        { name: 'Warning #', value: `${warningCount}`, inline: true },
                        { name: 'Moderator', value: interaction.user.tag, inline: true },
                        { name: 'Reason', value: reason, inline: false }
                    )
                    .setTimestamp();

                await targetUser.send({ embeds: [dmEmbed] });
            } catch {
                // User has DMs disabled
            }

        } catch (error) {
            console.error('[WARN COMMAND]', error);
            await interaction.reply({
                embeds: [errorEmbed('An error occurred while trying to warn the user.')],
                ephemeral: true,
            });
        }
    },
};
