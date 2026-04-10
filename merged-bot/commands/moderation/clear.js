const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clear messages from a channel')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Number of messages to clear (1-100)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true))
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Only clear messages from this user')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for clearing messages')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  cooldown: 5,
  permission: 'ManageMessages',

  async execute(interaction) {
    try {
      const amount = interaction.options.getInteger('amount');
      const targetUser = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';

      // Check if in a text channel
      if (interaction.channel.type !== ChannelType.GuildText) {
        return interaction.reply({
          embeds: [{ color: 0xFF0000, title: ' Error', description: 'This command can only be used in text channels!' }],
          ephemeral: true,
        });
      }

      // Fetch messages
      const messages = await interaction.channel.messages.fetch({ limit: amount });

      let messagesToDelete = messages;

      // Filter by user if specified
      if (targetUser) {
        messagesToDelete = messages.filter(msg => msg.author.id === targetUser.id);
      }

      // Filter out messages older than 14 days (Discord limitation)
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      const deletableMessages = messagesToDelete.filter(msg => msg.createdTimestamp > twoWeeksAgo);

      if (deletableMessages.size === 0) {
        return interaction.reply({
          embeds: [{ color: 0xFF0000, title: ' Error', description: 'No deletable messages found. Messages older than 14 days cannot be deleted.' }],
          ephemeral: true,
        });
      }

      // Bulk delete
      const deleted = await interaction.channel.bulkDelete(deletableMessages, true);

      // Send confirmation
      const filterText = targetUser ? ` from ${targetUser.tag}` : '';
      const embed = {
        color: 0x00FF00,
        title: ' Messages Cleared',
        description: `Successfully cleared **${deleted.size}** message(s)${filterText}.\n**Reason:** ${reason}`,
      };

      const reply = await interaction.reply({ embeds: [embed], fetchReply: true });

      // Delete confirmation after 5 seconds
      setTimeout(async () => {
        try {
          await reply.delete();
        } catch {
          // Message already deleted or can't delete
        }
      }, 5000);

    } catch (error) {
      console.error('[CLEAR COMMAND]', error);
      await interaction.reply({
        embeds: [{ color: 0xFF0000, title: ' Error', description: 'An error occurred while trying to clear messages. Messages older than 14 days cannot be deleted.' }],
        ephemeral: true,
      });
    }
  },
};
