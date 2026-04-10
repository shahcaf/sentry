const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency and API response time'),

  cooldown: 3,

  async execute(interaction) {
    const sent = await interaction.reply({
      content: 'Pinging...',
      fetchReply: true,
    });

    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = interaction.client.ws.ping;

    let status = ' Good';
    let color = 0x00FF00;
    if (latency > 500) {
      status = ' Poor';
      color = 0xFF0000;
    } else if (latency > 200) {
      status = ' Moderate';
      color = 0xFFFF00;
    }

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(' Pong!')
      .addFields(
        { name: 'Bot Latency', value: `\`${latency}ms\``, inline: true },
        { name: 'API Latency', value: `\`${apiLatency}ms\``, inline: true },
        { name: 'Status', value: status, inline: true }
      )
      .setFooter({ text: `Requested by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.editReply({ content: '', embeds: [embed] });
  },
};
