const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('View current SecurePass configuration for this server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply();
    const config = await db.getServer(interaction.guildId);

    if (!config) {
      return interaction.editReply({ content: ' SecurePass is not configured for this server. Use `/setup` first!' });
    }

    const embed = new EmbedBuilder()
      .setTitle(' Server Configuration')
      .setDescription(`Current settings for **${interaction.guild.name}**.`)
      .addFields(
        { name: ' Verified Role', value: config.role_id ? `<@&${config.role_id}>` : 'Not Set', inline: true },
        { name: ' Verification Channel', value: config.channel_id ? `<#${config.channel_id}>` : 'Not Set', inline: true },
        { name: ' Log Channel', value: config.log_channel_id ? `<#${config.log_channel_id}>` : 'Not Set', inline: true },
        { name: ' Auto-Verify', value: config.auto_verify ? ' Enabled' : ' Disabled', inline: true },
        { name: ' Anti-Link', value: config.anti_link ? ' Enabled' : ' Disabled', inline: true }
      )
      .setColor('#00bfff')
      .setFooter({ text: 'SecurePass + Utility Bot', iconURL: interaction.guild.iconURL() });

    await interaction.editReply({ embeds: [embed] });
  }
};
