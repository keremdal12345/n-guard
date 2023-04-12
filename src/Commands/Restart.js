const { SlashCommandBuilder, hyperlink  } = require("@discordjs/builders");
const { MessageEmbed, IntegrationApplication } = require("discord.js");
const Config = require("../Configs/BotConfig.json")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("restart")
    .setDescription("Guard/Backup Botlarını yeniden başlatmaya yarar."),

  async execute(interaction, client) {
    if(!Config.BotOwner.includes(interaction.user.id)) {
        return interaction.reply({ content: ":x: Bot developerı olmadığın için kullanamazsın.", ephemeral: true })
    }
    await interaction.reply({ content: `__**Bot**__ yeniden başlatılıyor!`, ephemeral: true })
    process.exit(0)
}
  };