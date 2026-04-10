const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

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
      const targetUser = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';

      // Check if user is trying to kick themselves
      if (targetUser.id === interaction.user.id) {
        return interaction.reply({
          embeds: [{ color: 0xFF0000, title: ' Error', description: 'You cannot kick yourself!' }],
          ephemeral: true,
        });
      }

      // Get member object
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

      if (!targetMember) {
        return interaction.reply({
          embeds: [{ color: 0xFF0000, title: ' Error', description: 'This user is not in the server!' }],
          ephemeral: true,
        });
      }

      // Check if target is owner
      if (targetMember.id === interaction.guild.ownerId) {
        return interaction.reply({
          embeds: [{ color: 0xFF0000, title: ' Error', description: 'I cannot kick the server owner!' }],
          ephemeral: true,
        });
      }

      // Check role hierarchy
      if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
        return interaction.reply({
          embeds: [{ color: 0xFF0000, title: ' Error', description: 'You cannot kick a member with equal or higher role than you!' }],
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
      const embed = {
        color: 0x00FF00,
        title: ' User Kicked',
        description: `Successfully kicked ${targetUser.tag} (${targetUser.id})\n**Reason:** ${reason}`,
      };

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('[KICK COMMAND]', error);
      await interaction.reply({
        embeds: [{ color: 0xFF0000, title: ' Error', description: 'An error occurred while trying to kick the user. Please check my permissions.' }],
        ephemeral: true,
      });
    }
  },
};
