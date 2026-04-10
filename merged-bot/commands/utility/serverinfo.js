const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Display information about the server'),

  cooldown: 5,

  async execute(interaction) {
    const { guild } = interaction;
    const owner = await guild.fetchOwner();

    // Count channels by type
    const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
    const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
    const categoryChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size;
    const forumChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildForum).size;

    // Count members
    const totalMembers = guild.memberCount;
    const botCount = guild.members.cache.filter(m => m.user.bot).size;
    const humanCount = totalMembers - botCount;

    // Get boosts
    const boostLevel = guild.premiumTier;
    const boostCount = guild.premiumSubscriptionCount || 0;

    // Create embed
    const embed = new EmbedBuilder()
      .setColor(guild.members.me?.displayHexColor || 0x5865F2)
      .setTitle(`${guild.name}'s Information`)
      .setThumbnail(guild.iconURL({ dynamic: true, size: 1024 }))
      .addFields(
        { name: ' General', value: [
          `**Name:** ${guild.name}`,
          `**ID:** ${guild.id}`,
          `**Owner:** ${owner.user.tag}`,
          `**Created:** <t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
        ].join('\n'), inline: false },

        { name: ' Members', value: [
          `**Total:** ${totalMembers}`,
          `**Humans:** ${humanCount}`,
          `**Bots:** ${botCount}`,
        ].join('\n'), inline: true },

        { name: ' Channels', value: [
          `**Text:** ${textChannels}`,
          `**Voice:** ${voiceChannels}`,
          `**Categories:** ${categoryChannels}`,
          forumChannels > 0 ? `**Forums:** ${forumChannels}` : '',
        ].filter(Boolean).join('\n'), inline: true },

        { name: ' Boosts', value: [
          `**Level:** ${boostLevel}`,
          `**Boosts:** ${boostCount}`,
        ].join('\n'), inline: true },
      )
      .setFooter({ text: `Requested by ${interaction.user.tag}` })
      .setTimestamp();

    // Add verification level
    const verificationLevels = ['None', 'Low', 'Medium', 'High', 'Very High'];
    embed.addFields({
      name: ' Security',
      value: `**Verification:** ${verificationLevels[guild.verificationLevel]}`,
      inline: true,
    });

    // Add roles count
    embed.addFields({
      name: ' Roles',
      value: `${guild.roles.cache.size}`,
      inline: true,
    });

    // Add emojis count
    embed.addFields({
      name: ' Emojis',
      value: `${guild.emojis.cache.size}`,
      inline: true,
    });

    // Add banner if exists
    if (guild.banner) {
      embed.setImage(guild.bannerURL({ size: 1024 }));
    }

    // Add description if exists
    if (guild.description) {
      embed.setDescription(guild.description);
    }

    await interaction.reply({ embeds: [embed] });
  },
};
