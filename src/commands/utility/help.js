const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const { checkCooldown } = require('../../utils/cooldown');
const { errorEmbed } = require('../../utils/embedBuilder');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Display all available commands'),

    cooldown: 5,

    async execute(interaction, client) {
        try {
            // Check cooldown
            const { onCooldown, remainingTime } = checkCooldown('help', interaction.user.id, this.cooldown);
            if (onCooldown) {
                return interaction.reply({
                    embeds: [errorEmbed(`Please wait ${remainingTime} seconds before using this command again.`)],
                    ephemeral: true,
                });
            }

            const commandsPath = path.join(__dirname, '..');
            const categories = fs.readdirSync(commandsPath).filter(folder => 
                fs.statSync(path.join(commandsPath, folder)).isDirectory()
            );

            // Create category select menu
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('help-select')
                .setPlaceholder('Select a category')
                .addOptions(
                    categories.map(category => ({
                        label: category.charAt(0).toUpperCase() + category.slice(1),
                        value: category,
                        description: `View ${category} commands`,
                    }))
                );

            const row = new ActionRowBuilder().addComponents(selectMenu);

            // Main help embed
            const mainEmbed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('📚 Bot Commands')
                .setDescription(`Welcome to the help menu! Select a category from the dropdown below to view commands.\n\n**Total Categories:** ${categories.length}\n**Prefix:** Use slash commands (/)`)
                .addFields(
                    { name: '🔗 Links', value: '[Support Server](https://discord.gg) • [Invite Bot](https://discord.com/oauth2)', inline: false }
                )
                .setFooter({ text: `Requested by ${interaction.user.tag}` })
                .setTimestamp();

            // Add category list
            const categoryList = categories.map(cat => `• **${cat.charAt(0).toUpperCase() + cat.slice(1)}**`).join('\n');
            mainEmbed.addFields({ name: '📂 Categories', value: categoryList, inline: false });

            const response = await interaction.reply({
                embeds: [mainEmbed],
                components: [row],
                fetchReply: true,
            });

            // Create collector for select menu
            const collector = response.createMessageComponentCollector({
                componentType: ComponentType.StringSelect,
                time: 60000,
            });

            collector.on('collect', async i => {
                if (i.user.id !== interaction.user.id) {
                    return i.reply({
                        content: 'You cannot use this menu!',
                        ephemeral: true,
                    });
                }

                const selectedCategory = i.values[0];
                const categoryPath = path.join(commandsPath, selectedCategory);
                const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));

                const commands = commandFiles.map(file => {
                    const command = require(path.join(categoryPath, file));
                    return {
                        name: command.data.name,
                        description: command.data.description,
                        cooldown: command.cooldown || 'None',
                        permission: command.permission || 'None',
                    };
                });

                const categoryEmbed = new EmbedBuilder()
                    .setColor(0x5865F2)
                    .setTitle(`📂 ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Commands`)
                    .setDescription(`Found ${commands.length} command(s) in this category.`)
                    .setFooter({ text: `Use /command for more details • Requested by ${interaction.user.tag}` })
                    .setTimestamp();

                commands.forEach(cmd => {
                    categoryEmbed.addFields({
                        name: `/${cmd.name}`,
                        value: `${cmd.description}\n⏱️ Cooldown: ${cmd.cooldown}s | 🔒 Permission: ${cmd.permission}`,
                        inline: false,
                    });
                });

                await i.update({ embeds: [categoryEmbed], components: [row] });
            });

            collector.on('end', async () => {
                try {
                    const disabledRow = new ActionRowBuilder().addComponents(
                        StringSelectMenuBuilder.from(row.components[0]).setDisabled(true)
                    );
                    await interaction.editReply({ components: [disabledRow] });
                } catch {
                    // Message deleted or can't edit
                }
            });

        } catch (error) {
            console.error('[HELP COMMAND]', error);
            await interaction.reply({
                embeds: [errorEmbed('An error occurred while generating the help menu.')],
                ephemeral: true,
            });
        }
    },
};
