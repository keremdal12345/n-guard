const { SlashCommandBuilder } = require("@discordjs/builders");
const { Discord, WebhookClient, Permissions } = require("discord.js");
const Config = require("../Configs/BotConfig.json")
const { green } = require("../Configs/BotConfig.json")
const CategoryChannels = require("../Models/CategoryChannels");
const TextChannels = require("../Models/TextChannels");
const VoiceChannels = require("../Models/VoiceChannels");
const moment = require("moment");
require("moment-duration-format");

module.exports = {
    data: new SlashCommandBuilder()
      .setName("kanal-kur")
      .setDescription("Silinen Ses/Yazı/Kategori Kanal Kurulumunu Gerçekleştirebilirsiniz.")
      .addStringOption((option) =>
      option.setName("id")
        .setDescription("Yüklenecek <kanal/kategori> belirtiniz.")
        .setRequired(true),
    ),
    async execute(interaction, bot) {
      if(!Config.BotOwner.includes(interaction.user.id)) {
        return interaction.reply({ content: ":x: Bot developerı olmadığın için kullanamazsın.", ephemeral: true })
      }

      var victim = interaction.options.getString("id");

      const tdata = await TextChannels.findOne({ channelID: victim });
      const vdata = await VoiceChannels.findOne({ channelID: victim });
      const cdata = await CategoryChannels.findOne({ channelID: victim });

      if (tdata) {
        newChannel = await interaction.guild.channels.create(tdata.name, {
            type: 'GUILD_TEXT',
            nsfw: tdata.nsfw,
            parent: tdata.parentID,
            position: tdata.position + 1,
            rateLimitPerUser: tdata.rateLimit
          })
          await interaction.reply({ content: `**${newChannel.name}** isimli Yazı Kanalının yedeği kuruluyor ve rol izinleri entegre ediliyor`, ephemeral: true })
          const newOverwrite = [];
          for (let index = 0; index < tdata.overwrites.length; index++) {
            const veri = tdata.overwrites[index];
            newOverwrite.push({
              id: veri.id,
              allow: new Permissions(veri.allow).toArray(),
              deny: new Permissions(veri.deny).toArray()
            });
          }
          await newChannel.permissionOverwrites.set(newOverwrite);
          tdata.channelID = newChannel.id
          tdata.save()
      return } else if (vdata) {
        newChannel = await interaction.guild.channels.create(vdata.name, {
          type: 'GUILD_VOICE',
          bitrate: vdata.bitrate,
          userLimit: vdata.userLimit,
          parent: vdata.parentID,
          position: vdata.position
        })
        await interaction.reply({ content: `**${newChannel.name}** isimli Ses Kanalının yedeği kuruluyor ve rol izinleri entegre ediliyor`, ephemeral: true })
        const newOverwrite = [];
        for (let index = 0; index < vdata.overwrites.length; index++) {
          const veri = vdata.overwrites[index];
          newOverwrite.push({
            id: veri.id,
            allow: new Permissions(veri.allow).toArray(),
            deny: new Permissions(veri.deny).toArray()
          });
        }
        await newChannel.permissionOverwrites.set(newOverwrite);
        vdata.channelID = newChannel.id
        vdata.save()
    return } else if (cdata) {
        const newChannel = await interaction.guild.channels.create(cdata.name, {
          type: 'GUILD_CATEGORY',
          position: cdata.position + 1,
        });
        await interaction.reply({ content: `**${newChannel.name}** isimli kategori yedeği kuruluyor ve kanallar içine aktarılıyor`, ephemeral: true })
        const textChannels = await TextChannels.find({ parentID: victim });
        await TextChannels.updateMany({ parentID: victim }, { parentID: newChannel.id });
        textChannels.forEach(c => {
          const textChannel = interaction.guild.channels.cache.get(c.channelID);
          if (textChannel) textChannel.setParent(newChannel, { lockPermissions: false });
        });
        const voiceChannels = await VoiceChannels.find({ parentID: victim });
        await VoiceChannels.updateMany({ parentID: victim }, { parentID: newChannel.id });
        voiceChannels.forEach(c => {
          const voiceChannel = interaction.guild.channels.cache.get(c.channelID);
          if (voiceChannel) voiceChannel.setParent(newChannel, { lockPermissions: false });
        });
        const newOverwrite = [];
        for (let index = 0; index < cdata.overwrites.length; index++) {
          const veri = cdata.overwrites[index];
          newOverwrite.push({
            id: veri.id,
            allow: new Permissions(veri.allow).toArray(),
            deny: new Permissions(veri.deny).toArray()
          });
        }
        await newChannel.permissionOverwrites.set(newOverwrite);
        cdata.channelID = newChannel.id
        cdata.save()
    return }
    if (!tdata || !vdata || !cdata) return interaction.reply({ content: "Belirtilen kanal ID'sine ait veri bulunamadı!", ephemeral: true }) 
    },
};