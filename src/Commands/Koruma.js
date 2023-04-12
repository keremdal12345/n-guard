const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const Config = require("../Configs/BotConfig.json")
const SafeMember = require("../Models/Safe");
const moment = require("moment");
require("moment-duration-format");

module.exports = {
    data: new SlashCommandBuilder()
      .setName("koruma")
      .setDescription("Sunucu Yetkilerini açıp, kapatırsınız."),
    async execute(interaction, bot) {
      if(!Config.BotOwner.includes(interaction.user.id)) {
        return interaction.reply({ content: ":x: Bot developerı olmadığın için kullanamazsın.", ephemeral: true })
      }

        const yt = new MessageButton()
        .setCustomId("yetki")
        .setLabel("Veri Kayıt")
        .setStyle("PRIMARY")

        const ac = new MessageButton()
        .setCustomId("aç")
        .setLabel("Koruma Aç")
        .setStyle("SUCCESS")
      
        const kapa = new MessageButton()
        .setCustomId("kapat")
        .setLabel("Koruma Kapat")
        .setStyle("DANGER")
    

        const row = new MessageActionRow()
        .addComponents([yt, ac, kapa])


        const embed = new MessageEmbed()
        .setDescription(`
        ${interaction.user.toString()}, \`${moment(Date.now()).format("LLL")}\` tarihinden  itibaren \`${interaction.guild.name}\` sunucusundaki yetki verilerinin işlem tablosu aşağıda belirtilmiştir.
        `)
        .addFields(
{
name: "\n\u200b", value: `
\`\`\`fix
Veri Kayıt
\`\`\`
Sunucu Yetki Verilerini Database Kayıt Eder.
`, inline: true
},
{
name: "\n\u200b", value: `
\`\`\`fix
Koruma Aç
\`\`\`
Sunucu Yetkisi Açık olan rollerin yetkilerini kapatır.
`, inline: true
},
{
name: "\n\u200b", value: `
\`\`\`fix
Koruma Kapat
\`\`\`
Sunucu Yetkisi Kapalı olan rollerin yetkilerini geri açar.
`, inline: true
},
)
.setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
.setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
.setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 2048 }))
.setTimestamp()

    interaction.reply({ embeds: [embed], components: [row] })

    const filter = i => i.user.id == interaction.user.id 
    let collector = interaction.channel.createMessageComponentCollector({ filter, componentType: 'BUTTON', max: 1, time: 20000 })

    collector.on("collect", async (interaction) => {

      let veri = await SafeMember.findOne({
        guildID: interaction.guild.id
    }) || {
        "Permissions": []
    };

    const izinler = [
        "ADMINISTRATOR"
    ]
    const data = [];

    if(interaction.customId === "yetki") {

        interaction.guild.roles.cache.filter(rol => izinler.some(rol2 => rol.permissions.has(rol2)) && !rol.managed).forEach(role => {
          data.push({ id: role.id })
        })
        await SafeMember.updateOne({ guildID: interaction.guild.id }, { $set: { Permissions: data } }, { upsert: true });
  
        const ytembed = new MessageEmbed()
          .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
          .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
          .setDescription(`${interaction.guild.name} sunucusundaki **yetki verileri** kaydedildi.\n\n**Kayıt Edilen Yetkiler:** \n\n${data.map(x => `<@&${x.id}>`).join("\n")}`)
  
          await interaction.update({ embeds: [ytembed], components: [] })
}

    if(interaction.customId === "aç") {
        if (veri.Permissions.length > 0) {
            const yetkiPermleri = ["ADMINISTRATOR", "MANAGE_ROLES", "MANAGE_CHANNELS", "MANAGE_GUILD"]
            interaction.guild.roles.cache.filter(rol => rol.editable).filter(rol => yetkiPermleri.some(yetki => rol.permissions.has(yetki))).forEach(async (rol) => rol.setPermissions(0n));
        interaction.update({ content: `Başarılı bir şekilde yetkileri kapattınız!`, embeds: [], components: [] })
    } else return interaction.update({ content: `Lütfen mevcut izinleri kaydediniz!`, embeds: [], components: [] })
    }
        
    if(interaction.customId === "kapat") {
        if (veri.Permissions.length > 0) {
            for (let i = 0; i < veri.Permissions.length; i++) {
                const elm = veri.Permissions[i];
                interaction.guild.roles.cache.get(elm.id).setPermissions(8n).catch();
            }
        interaction.update({ content: `Başarılı bir şekilde yetkileri açtınız!`, embeds: [], components: [] })
    } else return interaction.update({ content: `Lütfen mevcut izinleri kaydediniz!`, embeds: [], components: [] })
    }

})

},
};