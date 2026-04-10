const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { errorEmbed, successEmbed } = require('../../utils/embedBuilder');
const { checkCooldown } = require('../../utils/cooldown');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removerole')
        .setDescription('Remove a role from a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to remove the role from')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to remove')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for removing the role')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    cooldown: 5,
    permission: 'ManageRoles',

    async execute(interaction) {
        try {
            // Check cooldown
            const { onCooldown, remainingTime } = checkCooldown('removerole', interaction.user.id, this.cooldown);
            if (onCooldown) {
                return interaction.reply({
                    embeds: [errorEmbed(`Please wait ${remainingTime} seconds before using this command again.`)],
                    ephemeral: true,
                });
            }

            const targetUser = interaction.options.getUser('user');
            const role = interaction.options.getRole('role');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            // Check if target is a bot
            if (targetUser.id === interaction.client.user.id) {
                return interaction.reply({
                    embeds: [errorEmbed('I cannot manage my own roles!')],
                    ephemeral: true,
                });
            }

            // Get member
            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
            if (!targetMember) {
                return interaction.reply({
                    embeds: [errorEmbed('This user is not in the server!')],
                    ephemeral: true,
                });
            }

            // Check if user has the role
            if (!targetMember.roles.cache.has(role.id)) {
                return interaction.reply({
                    embeds: [errorEmbed(`${targetUser.tag} does not have the role ${role.name}!`)],
                    ephemeral: true,
                });
            }

            // Check role hierarchy
            if (role.position >= interaction.guild.members.me.roles.highest.position) {
                return interaction.reply({
                    embeds: [errorEmbed('I cannot remove a role that is higher than or equal to my highest role!')],
                    ephemeral: true,
                });
            }

            if (role.position >= interaction.member.roles.highest.position) {
                return interaction.reply({
                    embeds: [errorEmbed('You cannot remove a role that is higher than or equal to your highest role!')],
                    ephemeral: true,
                });
            }

            // Remove the role
            await targetMember.roles.remove(role, `${reason} - By ${interaction.user.tag}`);

            const embed = successEmbed(
                `Successfully removed ${role.name} from ${targetUser.tag}\n**Reason:** ${reason}`,
                'Role Removed'
            );

            await interaction.reply({ embeds: [embed] });

            // Try to DM the user
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(role.color || 0xFF0000)
                    .setTitle(`Role Removed in ${interaction.guild.name}`)
                    .setDescription(`The role **${role.name}** has been removed from you`)
                    .addFields(
                        { name: 'Moderator', value: interaction.user.tag, inline: true },
                        { name: 'Reason', value: reason, inline: false }
                    )
                    .setTimestamp();

                await targetUser.send({ embeds: [dmEmbed] });
            } catch {
                // User has DMs disabled
            }

        } catch (error) {
            console.error('[REMOVEROLE COMMAND]', error);
            await interaction.reply({
                embeds: [errorEmbed('An error occurred while trying to remove the role. Please check my permissions.')],
                ephemeral: true,
            });
        }
    },
};
