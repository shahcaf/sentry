const { EmbedBuilder } = require('discord.js');
const db = require('../utils/db');

module.exports = {
  name: 'modalSubmit',
  once: false,
  async execute(interaction, client) {
    if (interaction.customId !== 'verify_modal') return;

    await interaction.deferReply({ ephemeral: true });

    try {
      const user = interaction.user;
      const guild = interaction.guild;
      const reason = interaction.fields.getTextInputValue('verify_reason');

      // Check if user is blacklisted globally
      const isBlacklisted = await db.isBlacklisted(user.id);
      if (isBlacklisted) {
        const embed = {
          color: 0xFF0000,
          title: ' Access Denied',
          description: 'You are globally blacklisted from SecurePass servers.',
        };
        return interaction.editReply({ embeds: [embed] });
      }

      // Get server config
      const serverConfig = await db.getServer(guild.id);
      if (!serverConfig) {
        const embed = {
          color: 0xFF0000,
          title: ' Server Not Configured',
          description: 'This server has not configured SecurePass. Please contact an administrator.',
        };
        return interaction.editReply({ embeds: [embed] });
      }

      // Check if user is already verified
      const userData = await db.getUser(user.id);
      
      if (!userData || !userData.verified) {
        // Create new user record
        await db.upsertUser(user.id, true, 'SecurePass Verification');
      }

      // Give verified role
      const member = await guild.members.fetch(user.id);
      if (serverConfig.role_id) {
        await member.roles.add(serverConfig.role_id, 'SecurePass Verification');
      }

      // Log the verification
      await db.addLog('VERIFICATION_COMPLETED', user.id, guild.id);

      // Send success message
      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle(' Verification Complete')
        .setDescription(`You have been verified in **${guild.name}**!`)
        .addFields(
          { name: ' User', value: user.tag, inline: true },
          { name: ' Server', value: guild.name, inline: true },
          { name: ' Method', value: 'SecurePass Global', inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('[MODAL SUBMIT ERROR]', error);
      await interaction.editReply({
        embeds: [{ color: 0xFF0000, title: ' Error', description: 'An error occurred during verification.' }]
      });
    }
  },
};
