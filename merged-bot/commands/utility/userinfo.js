const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Display information about a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to get information about (defaults to you)')
        .setRequired(false)),

  cooldown: 3,

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    // Basic user info
    const embed = new EmbedBuilder()
      .setColor(targetMember?.displayHexColor || 0x5865F2)
      .setTitle(`${targetUser.username}'s Information`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 1024 }))
      .addFields(
        { name: ' User', value: [
          `**Username:** ${targetUser.username}`,
          `**Discriminator:** #${targetUser.discriminator || '0000'}`,
          `**ID:** ${targetUser.id}`,
          `**Mention:** <@${targetUser.id}>`,
          `**Bot:** ${targetUser.bot ? 'Yes' : 'No'}`,
        ].join('\n'), inline: true },

        { name: ' Dates', value: [
          `**Account Created:** <t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`,
        ].join('\n'), inline: false },
      )
      .setFooter({ text: `Requested by ${interaction.user.tag}` })
      .setTimestamp();

    // Add member-specific info if they're in the server
    if (targetMember) {
      const roles = targetMember.roles.cache
        .filter(role => role.id !== interaction.guild.id)
        .sort((a, b) => b.position - a.position)
        .map(role => `<@&${role.id}>`)
        .slice(0, 10) // Limit to 10 roles
        .join(', ') || 'None';

      const roleCount = targetMember.roles.cache.filter(r => r.id !== interaction.guild.id).size;

      embed.addFields(
        { name: ' Member Info', value: [
          `**Nickname:** ${targetMember.nickname || 'None'}`,
          `**Joined Server:** <t:${Math.floor(targetMember.joinedTimestamp / 1000)}:R>`,
          `**Roles [${roleCount}]:** ${roles}${roleCount > 10 ? '...' : ''}`,
          `**Highest Role:** <@&${targetMember.roles.highest.id}>`,
        ].join('\n'), inline: false },
      );

      // Check for timeout
      if (targetMember.isCommunicationDisabled()) {
        embed.addFields({
          name: ' Timeout', value: [
            `**Ends:** <t:${Math.floor(targetMember.communicationDisabledUntilTimestamp / 1000)}:R>`,
          ].join('\n'), inline: true,
        });
      }

      // Add presence info if available
      if (targetMember.presence) {
        const status = targetMember.presence.status;
        const statusEmojis = {
          online: ' Online',
          idle: ' Idle',
          dnd: ' Do Not Disturb',
          offline: ' Offline',
        };

        let activityText = 'None';
        if (targetMember.presence.activities.length > 0) {
          const activity = targetMember.presence.activities[0];
          activityText = `${activity.type === 0 ? 'Playing' : activity.type === 2 ? 'Listening to' : activity.type === 3 ? 'Watching' : 'Streaming'} **${activity.name}**`;
        }

        embed.addFields({
          name: ' Presence', value: [
            `**Status:** ${statusEmojis[status] || status}`,
            `**Activity:** ${activityText}`,
          ].join('\n'), inline: true,
        });
      }
    } else {
      embed.addFields({
        name: ' Note',
        value: 'This user is not a member of this server.',
        inline: false,
      });
    }

    // Add banner if available
    if (targetUser.banner) {
      embed.setImage(targetUser.bannerURL({ size: 1024 }));
    }

    // Add accent color if available
    if (targetUser.accentColor) {
      embed.setColor(targetUser.accentColor);
    }

    await interaction.reply({ embeds: [embed] });
  },
};
