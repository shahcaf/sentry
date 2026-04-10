const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { checkCooldown } = require('../../utils/cooldown');
const { errorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Get a user\'s avatar')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to get the avatar of (defaults to you)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type of avatar to get')
                .addChoices(
                    { name: 'User', value: 'user' },
                    { name: 'Server (if available)', value: 'server' }
                )
                .setRequired(false)),

    cooldown: 3,

    async execute(interaction) {
        try {
            // Check cooldown
            const { onCooldown, remainingTime } = checkCooldown('avatar', interaction.user.id, this.cooldown);
            if (onCooldown) {
                return interaction.reply({
                    embeds: [errorEmbed(`Please wait ${remainingTime} seconds before using this command again.`)],
                    ephemeral: true,
                });
            }

            const targetUser = interaction.options.getUser('user') || interaction.user;
            const avatarType = interaction.options.getString('type') || 'user';

            // Get member for server avatar
            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

            let avatarURL;
            let avatarTitle;

            if (avatarType === 'server' && targetMember?.avatar) {
                // Server-specific avatar
                avatarURL = targetMember.displayAvatarURL({ dynamic: true, size: 4096 });
                avatarTitle = `${targetUser.username}'s Server Avatar`;
            } else {
                // Global avatar
                avatarURL = targetUser.displayAvatarURL({ dynamic: true, size: 4096 });
                avatarTitle = `${targetUser.username}'s Avatar`;
            }

            // Determine file extension
            const isGif = avatarURL.includes('.gif');
            const fileExtension = isGif ? 'GIF' : 'PNG';

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle(`🖼️ ${avatarTitle}`)
                .setImage(avatarURL)
                .setFooter({ text: `Format: ${fileExtension} • Requested by ${interaction.user.tag}` })
                .setTimestamp();

            // Create buttons for different formats
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('Open in Browser')
                    .setStyle(ButtonStyle.Link)
                    .setURL(avatarURL),
                new ButtonBuilder()
                    .setLabel('JPEG Format')
                    .setStyle(ButtonStyle.Link)
                    .setURL(targetUser.displayAvatarURL({ extension: 'jpeg', size: 4096 })),
            );

            // Add PNG button if not already PNG
            if (isGif) {
                row.addComponents(
                    new ButtonBuilder()
                        .setLabel('PNG Format')
                        .setStyle(ButtonStyle.Link)
                        .setURL(targetUser.displayAvatarURL({ extension: 'png', size: 4096 }))
                );
            }

            await interaction.reply({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error('[AVATAR COMMAND]', error);
            await interaction.reply({
                embeds: [errorEmbed('An error occurred while fetching the avatar.')],
                ephemeral: true,
            });
        }
    },
};
