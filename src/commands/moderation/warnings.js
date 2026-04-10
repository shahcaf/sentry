const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { Warning } = require('../../models');
const { errorEmbed, successEmbed, infoEmbed } = require('../../utils/embedBuilder');
const { checkCooldown } = require('../../utils/cooldown');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('View warnings for a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check warnings for')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('show_all')
                .setDescription('Show all warnings including inactive ones')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    cooldown: 3,
    permission: 'KickMembers',

    async execute(interaction) {
        try {
            // Check cooldown
            const { onCooldown, remainingTime } = checkCooldown('warnings', interaction.user.id, this.cooldown);
            if (onCooldown) {
                return interaction.reply({
                    embeds: [errorEmbed(`Please wait ${remainingTime} seconds before using this command again.`)],
                    ephemeral: true,
                });
            }

            const targetUser = interaction.options.getUser('user');
            const showAll = interaction.options.getBoolean('show_all') || false;

            // Build query
            const query = {
                guildId: interaction.guild.id,
                userId: targetUser.id,
            };

            if (!showAll) {
                query.active = true;
            }

            // Get warnings
            const warnings = await Warning.find(query).sort({ createdAt: -1 });

            if (warnings.length === 0) {
                return interaction.reply({
                    embeds: [infoEmbed(`${targetUser.tag} has no warnings.`, 'No Warnings')],
                });
            }

            // Create embed
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle(`⚠️ Warnings for ${targetUser.tag}`)
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: `User ID: ${targetUser.id}` })
                .setTimestamp();

            // Add warning fields (limited to 25 due to Discord limits)
            const displayWarnings = warnings.slice(0, 25);
            
            for (const warning of displayWarnings) {
                const moderator = await interaction.client.users.fetch(warning.moderatorId).catch(() => ({ tag: 'Unknown' }));
                const status = warning.active ? '🟡 Active' : '⚫ Inactive';
                const date = `<t:${Math.floor(warning.createdAt.getTime() / 1000)}:R>`;

                embed.addFields({
                    name: `Warning #${warnings.indexOf(warning) + 1} ${status}`,
                    value: `**Reason:** ${warning.reason}\n**Moderator:** ${moderator.tag}\n**Date:** ${date}\n**ID:** \`${warning._id}\``,
                    inline: false,
                });
            }

            if (warnings.length > 25) {
                embed.setDescription(`Showing first 25 of ${warnings.length} warnings.`);
            }

            embed.addFields({
                name: 'Total Warnings',
                value: `${warnings.length} (${warnings.filter(w => w.active).length} active)`,
                inline: true,
            });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('[WARNINGS COMMAND]', error);
            await interaction.reply({
                embeds: [errorEmbed('An error occurred while fetching warnings.')],
                ephemeral: true,
            });
        }
    },
};
