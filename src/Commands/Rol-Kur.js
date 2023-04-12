const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, MessageButton, MessageActionRow, WebhookClient } = require("discord.js");
const RoleModel = require("../Models/Role");
const Config = require("../Configs/BotConfig.json");
const { green } = require("../Configs/BotConfig.json");
const moment = require("moment");
require("moment-duration-format");

module.exports = {
    data: new SlashCommandBuilder()
      .setName("rol-kur")
      .setDescription("Silinen Rol Kurulumunu Gerçekleştirebilirsiniz.")
      .addStringOption((option) =>
      option.setName("id")
      .setDescription("Yüklenecek <rol> belirtiniz.")
      .setRequired(true),
      ),
    async execute(interaction, bot) {
      if(!Config.BotOwner.includes(interaction.user.id)) {
        return interaction.reply({ content: ":x: Bot developerı olmadığın için kullanamazsın.", ephemeral: true })
      }

      const row = new MessageActionRow()
      .addComponents([
       new MessageButton()
      .setCustomId("onay")
      .setLabel("İşlemi Onayla")
      .setStyle("SUCCESS")
      .setEmoji('966805209848352778')
    ])

      var victim = interaction.options.getString("id");
      if (!victim || isNaN(victim)) return interaction.reply({ content:`Geçerli bir Rol ID'si belirtmelisin.`, ephemeral: true })
   
      const RoleData = await RoleModel.findOne({ guildID: Config.guildID, roleID: victim });
        if (!RoleData) return interaction.reply({ content:"Belirtilen Rol ID'si ile ilgili veri tabanında veri bulunamadı!", ephemeral: true })
        const kEmbed = new MessageEmbed()
        .setColor("#fd72a4")
        .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
        .setTimestamp()
        .setDescription(`**${RoleData.name}** adlı rolün yedeği kullanılarak rol oluşturulup, üyelere dağıtılacaktır.\nOnaylıyor iseniz **İşlemi Onayla** butonuna basınız!`)
    
        await interaction.reply({ embeds: [kEmbed], components: [row] })

        const filter = i => i.user.id == interaction.user.id 
        const collector = interaction.channel.createMessageComponentCollector({ filter, componentType: 'BUTTON', max: 1, time: 30000 });
        collector.on("collect", async (r) => {

          setTimeout(async function(){
          await interaction.deleteReply().catch(err => console.log(`Backup mesajı silinemedi..`));
    
          const yeniRol = await interaction.guild.roles.create({
            name: RoleData.name,
            color: RoleData.color,
            hoist: RoleData.hoist,
            permissions: RoleData.permissions,
            position: RoleData.position,
            mentionable: RoleData.mentionable,
            reason: "Databaseden Yeniden rol açıldı."
          });
          
          setTimeout(() => {
            let kanalPermVeri = RoleData.channelOverwrites;
            if (kanalPermVeri) kanalPermVeri.forEach((perm, index) => {
              let kanal = interaction.guild.channels.cache.get(perm.id);
              if (!kanal) return;
              setTimeout(() => {
                let yeniKanalPermVeri = {};
                perm.allow.forEach(p => {
                  yeniKanalPermVeri[p] = true;
                });
                perm.deny.forEach(p => {
                  yeniKanalPermVeri[p] = false;
                });
                kanal.permissionOverwrites.create(yeniRol, yeniKanalPermVeri).catch(console.error);
              }, index*5000);
            });
          }, 5000); 
   
          let clientsCount = Bots.length
          let clients = getClients(clientsCount);
          let length = RoleData.members.length;
               if (length <= 0) return console.log(`[${yeniRol.id}] Rol kurulumunda kayıtlı üye olmadığından dolayı rol dağıtımı gerçekleştirmedim.`);
                interaction.followUp({ content:`
Başarılı bir şekilde kurulum başladı roller dağıtılıyor kanallara izinleri ekleniyor.
**Aktif İşlem;**
\`\`\`cs
Role sahip ${RoleData.members.length} üye ${clients.length}'ı bot üye olmak üzere rolü destekçiler ile birlikte dağıtmaya başlıyorum
İşlemin biteceği tahmini süre: ${(length>1000 ? parseInt((length*(Config.Guard.GiveRoleDelay/1000)) / 60)+" dakika" : parseInt(length*(Config.Guard.GiveRoleDelay/1000))+" saniye")}
\`\`\`
`, ephemeral: true })
   
               let availableBots = global.Bots.filter(e => !e.Busy);
               if (availableBots.length <= 0) availableBots = global.Bots.sort((x, y) => y.Uj - x.Uj).slice(0, Math.round(length / global.Bots.length));
               let perAnyBotMembers = Math.floor(length / availableBots.length);
               if (perAnyBotMembers < 1) perAnyBotMembers = 1;
               for (let index = 0; index < availableBots.length; index++) {
                   const bot = availableBots[index];
                   let ids = RoleData.members.slice(index * perAnyBotMembers, (index + 1) * perAnyBotMembers);
                   if (ids.length <= 0) { processBot(bot, false, -perAnyBotMembers); break; }
                   let guild = bot.guilds.cache.get(Config.guildID); 
                   ids.every(async id => {
                  let member = guild.members.cache.get(id);
                  if(!member){
                   console.log(`[${victim}] Rol Kurulumundan sonra ${bot.user.username} - ${id} adlı üyeyi sunucuda bulamadım.`);
                   return true;}
                   await member.roles.add(yeniRol.id).then(e => {console.log(`[${victim}] Rol kurulumundan sonra ${bot.user.tag} - ${member.user.username} adlı üye ${yeniRol.name} rolünü aldı.`);}).catch(e => {console.log(`[${yeniRol.id}] Olayından sonra ${bot.user.username} - ${member.user.username} adlı üyeye rol veremedim.`);});});
                    processBot(bot, false, -perAnyBotMembers); }
    
              sendLog({ content:`${interaction.user} (\`${interaction.user.id}\`) kullanıcısı\n<#${interaction.channel.id}> (\`${interaction.channel.id}\`) kanalında \`/rol-kur\` komutu kullandı.\nKomut İçeriği: **${RoleData.name}** - (\`${RoleData.roleID}\`) rolün yedeğini kurmaya başladı.\n──────────────────────────`})
             }, 450)
           })
          },
};

const webHook = new WebhookClient({ id: Config.Logs.WebHookID, token: Config.Logs.WebHookToken });
async function sendLog(message) {
    webHook.send(message)
}

function giveBot(length) {
  if (length > global.Bots.length) length = global.Bots.length;
  let availableBots = global.Bots.filter(e => !e.Busy);
  if (availableBots.length <= 0) availableBots = global.Bots.sort((x, y) => x.Uj - y.Uj).slice(0, length);

  return availableBots;
}

function processBot(bot, busy, job, equal = false) {
  bot.Busy = busy;
  if (equal) bot.Uj = job;
  else bot.Uj += job;

  let index = global.Bots.findIndex(e => e.user.id == bot.user.id);
  global.Bots[index] = bot;
}

function getClients(count) {
  return Bots.slice(0, count);
}