const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { errorEmbed, successEmbed } = require('../../utils/embedBuilder');
const { checkCooldown } = require('../../utils/cooldown');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giverole')
        .setDescription('Give a role to a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to give the role to')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to give')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for giving the role')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    cooldown: 5,
    permission: 'ManageRoles',

    async execute(interaction) {
        try {
            // Check cooldown
            const { onCooldown, remainingTime } = checkCooldown('giverole', interaction.user.id, this.cooldown);
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

            // Check if user already has the role
            if (targetMember.roles.cache.has(role.id)) {
                return interaction.reply({
                    embeds: [errorEmbed(`${targetUser.tag} already has the role ${role.name}!`)],
                    ephemeral: true,
                });
            }

            // Check role hierarchy
            if (role.position >= interaction.guild.members.me.roles.highest.position) {
                return interaction.reply({
                    embeds: [errorEmbed('I cannot give a role that is higher than or equal to my highest role!')],
                    ephemeral: true,
                });
            }

            if (role.position >= interaction.member.roles.highest.position) {
                return interaction.reply({
                    embeds: [errorEmbed('You cannot give a role that is higher than or equal to your highest role!')],
                    ephemeral: true,
                });
            }

            // Give the role
            await targetMember.roles.add(role, `${reason} - By ${interaction.user.tag}`);

            const embed = successEmbed(
                `Successfully gave ${role.name} to ${targetUser.tag}\n**Reason:** ${reason}`,
                'Role Added'
            );

            await interaction.reply({ embeds: [embed] });

            // Try to DM the user
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(role.color || 0x00FF00)
                    .setTitle(`Role Added in ${interaction.guild.name}`)
                    .setDescription(`You have been given the role **${role.name}**`)
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
            console.error('[GIVEROLE COMMAND]', error);
            await interaction.reply({
                embeds: [errorEmbed('An error occurred while trying to give the role. Please check my permissions.')],
                ephemeral: true,
            });
        }
    },
};
