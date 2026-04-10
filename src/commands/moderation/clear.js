const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { errorEmbed, successEmbed } = require('../../utils/embedBuilder');
const { checkCooldown } = require('../../utils/cooldown');
const { logMessage } = require('../../utils/logger');

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
            // Check cooldown
            const { onCooldown, remainingTime } = checkCooldown('clear', interaction.user.id, this.cooldown);
            if (onCooldown) {
                return interaction.reply({
                    embeds: [errorEmbed(`Please wait ${remainingTime} seconds before using this command again.`)],
                    ephemeral: true,
                });
            }

            const amount = interaction.options.getInteger('amount');
            const targetUser = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            // Check if in a text channel
            if (interaction.channel.type !== ChannelType.GuildText) {
                return interaction.reply({
                    embeds: [errorEmbed('This command can only be used in text channels!')],
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
                    embeds: [errorEmbed('No deletable messages found. Messages older than 14 days cannot be deleted.')],
                    ephemeral: true,
                });
            }

            // Bulk delete
            const deleted = await interaction.channel.bulkDelete(deletableMessages, true);

            // Send confirmation
            const filterText = targetUser ? ` from ${targetUser.tag}` : '';
            const embed = successEmbed(
                `Successfully cleared **${deleted.size}** message(s)${filterText}.\n**Reason:** ${reason}`,
                'Messages Cleared'
            );

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
                embeds: [errorEmbed('An error occurred while trying to clear messages. Messages older than 14 days cannot be deleted.')],
                ephemeral: true,
            });
        }
    },
};
