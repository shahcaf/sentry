const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { checkCooldown } = require('../../utils/cooldown');
const { errorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('Check how long the bot has been online'),

    cooldown: 3,

    async execute(interaction) {
        try {
            // Check cooldown
            const { onCooldown, remainingTime } = checkCooldown('uptime', interaction.user.id, this.cooldown);
            if (onCooldown) {
                return interaction.reply({
                    embeds: [errorEmbed(`Please wait ${remainingTime} seconds before using this command again.`)],
                    ephemeral: true,
                });
            }

            // Calculate uptime
            const uptime = interaction.client.uptime;
            const seconds = Math.floor((uptime / 1000) % 60);
            const minutes = Math.floor((uptime / (1000 * 60)) % 60);
            const hours = Math.floor((uptime / (1000 * 60 * 60)) % 24);
            const days = Math.floor(uptime / (1000 * 60 * 60 * 24));

            // Get start time
            const startTime = new Date(Date.now() - uptime);

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🟢 Bot Uptime')
                .setDescription('Here is how long I have been online:')
                .addFields(
                    { name: '⏱️ Uptime', value: [
                        days > 0 ? `**${days}** day${days !== 1 ? 's' : ''}` : '',
                        hours > 0 ? `**${hours}** hour${hours !== 1 ? 's' : ''}` : '',
                        minutes > 0 ? `**${minutes}** minute${minutes !== 1 ? 's' : ''}` : '',
                        `**${seconds}** second${seconds !== 1 ? 's' : ''}`,
                    ].filter(Boolean).join(', ') || 'Less than a second', inline: false },

                    { name: '📅 Started', value: `<t:${Math.floor(startTime.getTime() / 1000)}:F>`, inline: true },
                    { name: '🕐 Relative', value: `<t:${Math.floor(startTime.getTime() / 1000)}:R>`, inline: true },
                )
                .setFooter({ text: `Requested by ${interaction.user.tag}` })
                .setTimestamp();

            // Add memory usage info
            const memoryUsage = process.memoryUsage();
            embed.addFields({
                name: '💾 Memory Usage',
                value: [
                    `**RSS:** ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
                    `**Heap Used:** ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
                ].join('\n'),
                inline: false,
            });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('[UPTIME COMMAND]', error);
            await interaction.reply({
                embeds: [errorEmbed('An error occurred while fetching uptime information.')],
                ephemeral: true,
            });
        }
    },
};
