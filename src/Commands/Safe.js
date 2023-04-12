const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, MessageActionRow, MessageSelectMenu } = require("discord.js");
const ayar = require("../Configs/BotConfig.json")
const SafeMember = require("../Models/Safe")
const table = require("table")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("safe")
    .setDescription(
      "Güvenli listeye üye kelemenizi sağlar."
    )

    .addUserOption((option) =>
      option.setName("kişi")
        .setDescription("Bir kişi belirtebilirsiniz."),
    )
    .addRoleOption((option) =>
      option.setName("rol")
        .setDescription("Bir rol belirtebilirsiniz.")
    ),
  // ! const member = interaction.options.getMember("kişi");

  async execute(interaction, bot) {
    if(!ayar.BotOwner.includes(interaction.user.id)) {
      return interaction.reply({ content: ":x: Bot developerı olmadığın için komutu kullanamazsın.", ephemeral: true })
    }

    var veri = await SafeMember.findOne({
      guildID: interaction.guild.id
    }) || {
      "Full": [],
      "RoleAndChannel": [],
      "Role": [],
      "Channel": [],
      "Bot": [],
      "BanAndKick": [],
      "ChatG": [],
      "Permissions": [],
      "SafeRole": []
    };

    var victim = interaction.options.getMember("kişi") || interaction.options.getRole("rol");

    const row = new MessageActionRow()
      .addComponents(
        new MessageSelectMenu()
          .setCustomId('select')
          .setPlaceholder('Güvenli eklemek/çıkarmak istediğiniz kategoriyi seçiniz')
          .addOptions([
            {
              label: 'Full',
              value: 'Full',

            },
            {
              label: 'Role & Channel',
              value: 'Role&Channel',
            },
            {
              label: 'Role',
              value: 'Role',
            },
            {
              label: 'Channel',
              value: 'Channel',
            },

            {
              label: 'Ban & Kick',
              value: 'Ban&Kick',
            },

            {
              label: 'Bot',
              value: 'Bot',
            },
            {
              label: 'Chat',
              value: 'Chat',
            },
            {
              label: 'Sekme',
              value: 'Sekme',
            },
            {
              label: 'Safe Role',
              value: 'Saferole',
            },

          ])
      );

    const row2 = new MessageActionRow()
      .addComponents(
        new MessageSelectMenu()
          .setCustomId('select2')
          .setPlaceholder('Güvenli liste bilgilendirme için tıklayınız')
          .addOptions([
            {
              label: 'Güvenli Liste Bilgilendirme',
              description: 'Güvenli liste kategorileri hakkında bilgi almanızı sağlar.',
              value: 'help',
            },
            {
              label: 'Güvenli Liste',
              description: 'Güvenli listede bulunan kişileri gösterir.',
              value: 'help2',
            },
          ]),
      );
    if (victim) {
      await interaction.reply({ content: `${victim ? `(${victim})` : ""} Güvenli listeye eklemek veya çıkarmak için aşağıdaki menüyü kullanınız.`, components: [row] });
    } else {
      await interaction.reply({ content: `Güvenli liste hakkında bilgi almak için aşağıdaki menüyü kullanınız.`, components: [row2] });
    }


    const embed = new MessageEmbed()
      .setDescription(`${interaction.member.toString()}, ${interaction.guild.name} sunucusu içerisinde Aşağıdaki listeden güvenli kategorilerine ekli olan kişileri/rolleri görebilirsiniz.`)

      .addFields(
        {
          name: "\n\u200b", value: `
\`\`\`yaml
Full
\`\`\`
${veri.Full.length > 0 ? veri.Full.map(x => `${interaction.guild.members.cache.get(x) ? interaction.guild.members.cache.get(x) : interaction.guild.roles.cache.get(x)}`).join(" \n") : "Herhangi bir üye & rol güvenliye eklenmedi!"}
`, inline: true
        },
        {
          name: "\n\u200b", value: `
\`\`\`yaml
Role & Channel
\`\`\`
${veri.RoleAndChannel.length > 0 ? veri.RoleAndChannel.map(x => `${interaction.guild.members.cache.get(x) ? interaction.guild.members.cache.get(x) : interaction.guild.roles.cache.get(x)}`).join(" \n") : "Herhangi bir üye & rol güvenliye eklenmedi!"}
`, inline: true
        },

        {
          name: "\n\u200b", value: `
\`\`\`yaml
Role
\`\`\`
${veri.Role.length > 0 ? veri.Role.map(x => `${interaction.guild.members.cache.get(x) ? interaction.guild.members.cache.get(x) : interaction.guild.roles.cache.get(x)}`).join(" \n") : "Herhangi bir üye & rol güvenliye eklenmedi!"}
`, inline: true
        },
      )

      .addFields(
        {
          name: "\n\u200b", value: `
\`\`\`yaml
Channel
\`\`\`
${veri.Channel.length > 0 ? veri.Channel.map(x => `${interaction.guild.members.cache.get(x) ? interaction.guild.members.cache.get(x) : interaction.guild.roles.cache.get(x) ? interaction.guild.roles.cache.get(x) : interaction.guild.channels.cache.get(x)}`).join(" \n") : "Herhangi bir üye & rol güvenliye eklenmedi!"}
`, inline: true
        },

        {
          name: "\n\u200b", value: `
\`\`\`yaml
Bot
\`\`\`
${veri.Bot.length > 0 ? veri.Bot.map(x => `${interaction.guild.members.cache.get(x) ? interaction.guild.members.cache.get(x) : interaction.guild.roles.cache.get(x)}`).join(" \n") : "Herhangi bir üye & rol güvenliye eklenmedi!"}
`, inline: true
        },

        {
          name: "\n\u200b", value: `
\`\`\`yaml
Chat
\`\`\`
${veri.ChatG.length > 0 ? veri.ChatG.map(x => `${interaction.guild.members.cache.get(x) ? interaction.guild.members.cache.get(x) : interaction.guild.roles.cache.get(x) ? interaction.guild.roles.cache.get(x) : interaction.guild.channels.cache.get(x)}`).join(" \n") : "Herhangi bir üye & rol güvenliye eklenmedi!"} 
`, inline: true
        },
      )

      .addFields(
        {
          name: "\n\u200b", value: `
\`\`\`yaml
Ban & Kick
\`\`\`
${veri.BanAndKick.length > 0 ? veri.BanAndKick.map(x => `${interaction.guild.members.cache.get(x) ? interaction.guild.members.cache.get(x) : interaction.guild.roles.cache.get(x)}`).join(" \n") : "Herhangi bir üye & rol güvenliye eklenmedi!"}
`, inline: true
        },

        {
          name: "\n\u200b", value: `
\`\`\`yaml
Güvenli Rol
\`\`\`
${veri.SafeRole.length > 0 ? veri.SafeRole.map(x => `${interaction.guild.roles.cache.get(x) ? interaction.guild.roles.cache.get(x) : x}`).join(" \n") : "Herhangi bir üye & rol güvenliye eklenmedi!"}
`, inline: true
        },

        {
          name: "\n\u200b", value: `
\`\`\`yaml
Sekme Koruma
\`\`\`
${veri.SekmeG.length > 0 ? veri.SekmeG.map(x => `${interaction.guild.members.cache.get(x) ? interaction.guild.members.cache.get(x) : interaction.guild.roles.cache.get(x) ? interaction.guild.roles.cache.get(x) : interaction.guild.channels.cache.get(x)}`).join(" \n") : "Herhangi bir üye & rol güvenliye eklenmedi!"} 
`, inline: true
        },
      )

      .setFooter(
        {
          text: interaction.user.tag,
          iconURL: interaction.member.displayAvatarURL({ dynamic: true })
        }
      )


    const embed2 = new MessageEmbed()
      .setDescription(`${interaction.member.toString()}, ${interaction.guild.name} sunucusu içerisinde Aşağıdaki listeden güvenli kategorilerinin yapamadığı işlemleri görebilirsiniz.

__**FULL KATEGORİSİ YAPAMADIĞI İŞLEMLER**__
\`\`\`diff
- Bot Ekleme (Jail)
- URL Değiştirme (Ban)
- Güvenli Rolleri Silme (Ban)
\`\`\`
__**ROLE & CHANNEL KATEGORİSİ YAPAMADIĞI İŞLEMLER**__  
\`\`\`diff
- Bot Ekleme (Jail)                    
- URL Değiştirme (Ban)                              
- Güvenli Rolleri Silme (Ban)         
- Ban & Kick Kullanma (Jail)                
\`\`\`
__**ROLE KATEGORİSİ YAPAMADIĞI İŞLEMLER**__
\`\`\`diff
- Bot Ekleme (Jail)
- URL Değiştirme (Ban)
- Güvenli Rolleri Silme (Ban)
- Ban & Kick Kullanma (Jail)
- Kanal Silme (Jail)
- Kanal Oluşturma (Jail)
- Kanal Güncelleme (Jail)
\`\`\`
__**CHANNEL KATEGORİSİ YAPAMADIĞI İŞLEMLER**__
\`\`\`diff
- Bot Ekleme (Jail)
- URL Değiştirme (Ban)
- Ban & Kick Kullanma (Jail)
- Güvenli Rolleri Silme (Ban)
- Rol Silme (Ban)
- Rol Verme (Jail)
- Rol Güncelleme (Jail)
- Rol Oluşturma (Jail)
\`\`\`
__**BAN & KİCK KATEGORİSİ YAPAMADIĞI İŞLEMLER**__
\`\`\`diff
- Bot Ekleme (Jail)
- URL Değiştirme (Ban)
- Güvenli Rolleri Silme (Ban)
- Kanal Silme (Jail)
- Kanal Oluşturma (Jail)
- Kanal Güncelleme (Jail)
- Rol Silme (Ban)
- Rol Verme (Jail)
- Rol Güncelleme (Jail)
- Rol Oluşturma (Jail)
\`\`\`
__**BOT KATEGORİSİ YAPAMADIĞI İŞLEMLER**__
\`\`\`diff
- URL Değiştirme (Ban)
- Güvenli Rolleri Silme (Ban)
- Ban & Kick Kullanma (Jail)
- Kanal Silme (Jail)
- Kanal Oluşturma (Jail)
- Kanal Güncelleme (Jail)
- Rol Silme (Ban)
- Rol Verme (Jail)
- Rol Güncelleme (Jail)
- Rol Oluşturma (Jail)
\`\`\`
`)

      .setFooter(
        {
          text: interaction.user.tag,
          iconURL: interaction.member.displayAvatarURL({ dynamic: true })
        }
      )

 const filter = i => i.user.id == interaction.user.id 
 const collector = interaction.channel.createMessageComponentCollector({ filter, componentType: 'SELECT_MENU', max: 1, time: 20000 });
 collector.on("collect", async (interaction) => {

      if (interaction.values[0] === "Full") {
        if (veri.Full.includes(victim.id)) {
          await SafeMember.updateOne({ guildID: interaction.guild.id }, { $pull: { Full: victim.id } }, { upsert: true });
          interaction.reply({ content: `${victim ? `(${victim})` : ""} başarıyla güvenli listeden kaldırıldı. (${interaction.values[0]})`, ephemeral: true }).catch({})
        } else {
          await SafeMember.updateOne({ guildID: interaction.guild.id }, { $push: { Full: victim.id } }, { upsert: true });
          await interaction.reply({ content: `${victim ? `(${victim})` : ""} başarıyla güvenli listeye eklendi. (${interaction.values[0]})`, ephemeral: true }).catch({})
        }
      }
      if (interaction.values[0] === "Role&Channel") {
        if (veri.RoleAndChannel.includes(victim.id)) {
          await SafeMember.updateOne({ guildID: interaction.guild.id }, { $pull: { RoleAndChannel: victim.id } }, { upsert: true });
          await interaction.reply({ content: `${victim ? `(${victim})` : ""} başarıyla güvenli listeden kaldırıldı. (${interaction.values[0]})`, ephemeral: true }).catch({})
        } else {
          await SafeMember.updateOne({ guildID: interaction.guild.id }, { $push: { RoleAndChannel: victim.id } }, { upsert: true });
          await interaction.reply({ content: `${victim ? `(${victim})` : ""} başarıyla güvenli listeye eklendi. (${interaction.values[0]})`, ephemeral: true }).catch({})
        }
      }
      if (interaction.values[0] === "Role") {
        if (veri.Role.includes(victim.id)) {
          await SafeMember.updateOne({ guildID: interaction.guild.id }, { $pull: { Role: victim.id } }, { upsert: true });
          await interaction.reply({ content: `${victim ? `(${victim})` : ""} başarıyla güvenli listeden kaldırıldı. (${interaction.values[0]})`, ephemeral: true }).catch({})
        } else {
          await SafeMember.updateOne({ guildID: interaction.guild.id }, { $push: { Role: victim.id } }, { upsert: true });
          await interaction.reply({ content: `${victim ? `(${victim})` : ""} başarıyla güvenli listeye eklendi. (${interaction.values[0]})`, ephemeral: true }).catch({})
        }
      }
      if (interaction.values[0] === "Channel") {
        if (veri.Channel.includes(victim.id)) {
          await SafeMember.updateOne({ guildID: interaction.guild.id }, { $pull: { Channel: victim.id } }, { upsert: true });
          await interaction.reply({ content: `${victim ? `(${victim})` : ""} başarıyla güvenli listeden kaldırıldı. (${interaction.values[0]})`, ephemeral: true }).catch({})
        } else {
          await SafeMember.updateOne({ guildID: interaction.guild.id }, { $push: { Channel: victim.id } }, { upsert: true });
          await interaction.reply({ content: `${victim ? `(${victim})` : ""} başarıyla güvenli listeye eklendi. (${interaction.values[0]})`, ephemeral: true }).catch({})
        }
      }
      if (interaction.values[0] === "Ban&Kick") {
        if (veri.BanAndKick.includes(victim.id)) {
          await SafeMember.updateOne({ guildID: interaction.guild.id }, { $pull: { BanAndKick: victim.id } }, { upsert: true });
          await interaction.reply({ content: `${victim ? `(${victim})` : ""} başarıyla güvenli listeden kaldırıldı. (${interaction.values[0]})`, ephemeral: true }).catch({})
        } else {
          await SafeMember.updateOne({ guildID: interaction.guild.id }, { $push: { BanAndKick: victim.id } }, { upsert: true });
          await interaction.reply({ content: `${victim ? `(${victim})` : ""} başarıyla güvenli listeye eklendi. (${interaction.values[0]})`, ephemeral: true }).catch({})
        }
      }
      if (interaction.values[0] === "Bot") {
        if (veri.Bot.includes(victim.id)) {
          await SafeMember.updateOne({ guildID: interaction.guild.id }, { $pull: { Bot: victim.id } }, { upsert: true });
          await interaction.reply({ content: `${victim ? `(${victim})` : ""} başarıyla güvenli listeden kaldırıldı. (${interaction.values[0]})`, ephemeral: true }).catch({})
        } else {
          await SafeMember.updateOne({ guildID: interaction.guild.id }, { $push: { Bot: victim.id } }, { upsert: true });
          await interaction.reply({ content: `${victim ? `(${victim})` : ""} başarıyla güvenli listeye eklendi. (${interaction.values[0]})`, ephemeral: true }).catch({})
        }
      }
      if (interaction.values[0] === "Chat") {
        if (veri.ChatG.includes(victim.id)) {
          await SafeMember.updateOne({ guildID: interaction.guild.id }, { $pull: { ChatG: victim.id } }, { upsert: true });
          await interaction.reply({ content: `${victim ? `(${victim})` : ""} başarıyla güvenli listeden kaldırıldı. (${interaction.values[0]})`, ephemeral: true }).catch({})
        } else {
          await SafeMember.updateOne({ guildID: interaction.guild.id }, { $push: { ChatG: victim.id } }, { upsert: true });
          await interaction.reply({ content: `${victim ? `(${victim})` : ""} başarıyla güvenli listeye eklendi. (${interaction.values[0]})`, ephemeral: true }).catch({})
        }
      }
      if (interaction.values[0] === "Sekme") {
        if (veri.SekmeG.includes(victim.id)) {
          await SafeMember.updateOne({ guildID: interaction.guild.id }, { $pull: { SekmeG: victim.id } }, { upsert: true });
          await interaction.reply({ content: `${victim ? `(${victim})` : ""} başarıyla güvenli listeden kaldırıldı. (${interaction.values[0]})`, ephemeral: true }).catch({})
        } else {
          await SafeMember.updateOne({ guildID: interaction.guild.id }, { $push: { SekmeG: victim.id } }, { upsert: true });
          await interaction.reply({ content: `${victim ? `(${victim})` : ""} başarıyla güvenli listeye eklendi. (${interaction.values[0]})`, ephemeral: true }).catch({})
        }
      }
      if (interaction.values[0] === "Saferole") {
        if (veri.SafeRole.includes(victim.id)) {
          await SafeMember.updateOne({ guildID: interaction.guild.id }, { $pull: { SafeRole: victim.id } }, { upsert: true });
          await interaction.reply({ content: `${victim ? `(${victim})` : ""} başarıyla güvenli listeden kaldırıldı. (${interaction.values[0]})`, ephemeral: true }).catch({})
        } else {
          await SafeMember.updateOne({ guildID: interaction.guild.id }, { $push: { SafeRole: victim.id } }, { upsert: true });
          await interaction.reply({ content: `${victim ? `(${victim})` : ""} başarıyla güvenli listeye eklendi. (${interaction.values[0]})`, ephemeral: true }).catch({})
        }
      }

      if (interaction.values[0] === "help") {
        await interaction.reply({ embeds: [embed2], ephemeral: true }).catch({});
      }
      if (interaction.values[0] === "help2") {
        await interaction.reply({ embeds: [embed], ephemeral: true }).catch({});
      }

    });

  },

}

