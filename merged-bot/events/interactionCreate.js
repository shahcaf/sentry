const { InteractionType, Collection } = require('discord.js');
const db = require('../utils/db');

module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction, client) {
    // Handle button interactions (SecurePass verification)
    if (interaction.isButton()) {
      if (interaction.customId === 'verify_start_panel') {
        await handleVerification(interaction, client);
      }
      return;
    }

    // Handle slash commands
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`[COMMAND] No command matching ${interaction.commandName} was found.`);
      return;
    }

    // Check cooldown
    if (command.cooldown) {
      const { cooldowns } = client;
      if (!cooldowns.has(command.data.name)) {
        cooldowns.set(command.data.name, new Collection());
      }

      const now = Date.now();
      const timestamps = cooldowns.get(command.data.name);
      const cooldownAmount = (command.cooldown || 3) * 1000;

      if (timestamps.has(interaction.user.id)) {
        const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

        if (now < expirationTime) {
          const timeLeft = Math.ceil((expirationTime - now) / 1000);
          return interaction.reply({
            embeds: [{ 
              color: 0xFF0000, 
              title: ' Cooldown', 
              description: `Please wait ${timeLeft} more second(s) before reusing the \`${command.data.name}\` command.` 
            }],
            ephemeral: true,
          });
        }
      }

      timestamps.set(interaction.user.id, now);
      setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
    }

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(`[COMMAND ERROR] ${interaction.commandName}:`, error);

      const errorMessage = {
        embeds: [{ color: 0xFF0000, title: ' Error', description: 'There was an error while executing this command!' }],
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  },
};

async function handleVerification(interaction, client) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const user = interaction.user;
    const guild = interaction.guild;
    
    // Check if user is already verified globally
    const userData = await db.getUser(user.id);
    
    if (userData && userData.verified) {
      // Auto-verify if returning user
      const serverConfig = await db.getServer(guild.id);
      if (serverConfig && serverConfig.role_id && serverConfig.auto_verify) {
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (member && !member.roles.cache.has(serverConfig.role_id)) {
          await member.roles.add(serverConfig.role_id, 'Auto-verified returning user');
          
          const embed = {
            color: 0x00FF00,
            title: ' Verification Complete',
            description: `Welcome back to **${guild.name}**! Your global verification has been restored.`,
          };
          
          await interaction.editReply({ embeds: [embed] });
          return;
        }
      }
    }

    // Create verification modal
    const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
    
    const modal = new ModalBuilder()
      .setCustomId('verify_modal')
      .setTitle(' SecurePass Verification')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('verify_reason')
            .setLabel('Why do you want to join this server?')
            .setStyle(TextInputStyle.Paragraph)
            .setMinLength(10)
            .setMaxLength(500)
            .setPlaceholder('Tell us why you want to join this server...')
            .setRequired(true)
        )
      );

    await interaction.showModal(modal);
  } catch (error) {
    console.error('[VERIFICATION ERROR]', error);
    await interaction.editReply({
      embeds: [{ color: 0xFF0000, title: ' Error', description: 'An error occurred during verification setup.' }]
    });
  }
}
