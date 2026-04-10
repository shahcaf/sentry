const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blacklist')
    .setDescription('Globally blacklist a user from all SecurePass servers.')
    .addUserOption(option => 
      option.setName('user').setDescription('The user to blacklist').setRequired(true))
    .addStringOption(option => 
      option.setName('reason').setDescription('The reason for global blacklisting').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply();
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');

    await db.blacklistUser(user.id, reason);

    const embed = new EmbedBuilder()
      .setTitle(' Global Blacklist Issued')
      .setDescription(`User **${user.tag}** has been globally blacklisted.`)
      .addFields(
        { name: ' User', value: `${user} (${user.id})`, inline: true },
        { name: ' Reason', value: reason, inline: true }
      )
      .setColor('#ff0000')
      .setFooter({ text: 'SecurePass + Utility Bot', iconURL: interaction.client.user.displayAvatarURL() });

    await interaction.editReply({ embeds: [embed] });
  }
};
