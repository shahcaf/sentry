const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to ban')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the ban')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('days')
        .setDescription('Days of messages to delete (0-7)')
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  cooldown: 5,
  permission: 'BanMembers',

  async execute(interaction) {
    try {
      const targetUser = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const deleteDays = interaction.options.getInteger('days') || 0;

      // Check if user is trying to ban themselves
      if (targetUser.id === interaction.user.id) {
        return interaction.reply({
          embeds: [{ color: 0xFF0000, title: ' Error', description: 'You cannot ban yourself!' }],
          ephemeral: true,
        });
      }

      // Get member object
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

      // Check if target is owner
      if (targetMember && targetMember.id === interaction.guild.ownerId) {
        return interaction.reply({
          embeds: [{ color: 0xFF0000, title: ' Error', description: 'I cannot ban the server owner!' }],
          ephemeral: true,
        });
      }

      // Check role hierarchy
      if (targetMember && targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
        return interaction.reply({
          embeds: [{ color: 0xFF0000, title: ' Error', description: 'You cannot ban a member with equal or higher role than you!' }],
          ephemeral: true,
        });
      }

      // Check if already banned
      const banList = await interaction.guild.bans.fetch().catch(() => new Collection());
      if (banList.has(targetUser.id)) {
        return interaction.reply({
          embeds: [{ color: 0xFF0000, title: ' Error', description: 'This user is already banned!' }],
          ephemeral: true,
        });
      }

      // Ban the user
      await interaction.guild.members.ban(targetUser.id, {
        deleteMessageDays: deleteDays,
        reason: `${reason} - Banned by ${interaction.user.tag}`,
      });

      // Send confirmation
      const embed = {
        color: 0x00FF00,
        title: ' User Banned',
        description: `Successfully banned ${targetUser.tag} (${targetUser.id})\n**Reason:** ${reason}${deleteDays > 0 ? `\n**Deleted Messages:** ${deleteDays} days` : ''}`,
      };

      await interaction.reply({ embeds: [embed] });

      // Try to DM the banned user
      try {
        const dmEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle(`You have been banned from ${interaction.guild.name}`)
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

    } catch (error) {
      console.error('[BAN COMMAND]', error);
      await interaction.reply({
        embeds: [{ color: 0xFF0000, title: ' Error', description: 'An error occurred while trying to ban the user. Please check my permissions.' }],
        ephemeral: true,
      });
    }
  },
};
