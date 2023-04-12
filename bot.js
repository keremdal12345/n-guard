const { Client, GuildMember, GuildAuditLogsEntry, WebhookClient, MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const Discord  = require("discord.js");

const { getVoiceConnection, joinVoiceChannel } = require("@discordjs/voice");
const RoleModel = require("./src/Models/Role");
const SafeMember = require("./src/Models/Safe");

const CategoryChannels = require("./src/Models/CategoryChannels");
const TextChannels = require("./src/Models/TextChannels");
const VoiceChannels = require("./src/Models/VoiceChannels");

const Config = require("./src/Configs/BotConfig.json");
const QueryManager = require("./src/query");
const request = require("request");
const moment = require("moment");
require("moment-duration-format")
moment.locale("tr")

const RoleGuard = new Client({ fetchAllMembers: true, intents: 32767 }); 
const ChannelGuard = new Client({ fetchAllMembers: true, intents: 32767 });
const OtherGuard = new Client({ fetchAllMembers: true, intents: 32767 });

RoleGuard.on("ready", async () => {
    setInterval(() => {
      const oynuyor = Config.BotDurum;
      const index = Math.floor(Math.random() * (oynuyor.length));

      RoleGuard.user.setActivity(`${oynuyor[index]}`, {
        type: "STREAMING",
        url: "https://www.twitch.tv/jaylenozi"});

    }, 10000);
    console.log("Rol koruma botu aktif.");
});
RoleGuard.login(process.env.roletoken);

ChannelGuard.on("ready", () => {
    setInterval(() => {
        const oynuyor = Config.BotDurum;
        const index = Math.floor(Math.random() * (oynuyor.length));
  
        ChannelGuard.user.setActivity(`${oynuyor[index]}`, {
          type: "STREAMING",
          url: "https://www.twitch.tv/jaylenozi"});
  
      }, 10000);
    console.log("Kanal koruma botu aktif.");
});
ChannelGuard.login(process.env.channeltoken);

OtherGuard.on("ready", () => {
    
    const guild = OtherGuard.guilds.cache.first();
    const connection = getVoiceConnection(guild.id);
    if (connection) return;

    joinVoiceChannel({
        channelId: Config.BotSesKanal,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: true
    });
    setInterval(() => {
        const oynuyor = Config.BotDurum;
        const index = Math.floor(Math.random() * (oynuyor.length));
  
        OtherGuard.user.setActivity(`${oynuyor[index]}`, {
          type: "STREAMING",
          url: "https://www.twitch.tv/jaylenozi"});
  
      }, 10000);
      
    console.log("Harici koruma botu aktif.");
    rolbackup();
    kanalbackup();
    setInterval(async () => {
        await rolbackup();
        await kanalbackup();
    }, 1000 * 60 * 60 * 3)
});
OtherGuard.login(process.env.othertoken);

const Bots = global.Bots = [];

Config.Guards.forEach(async token => {
const guardClient = global.client = new Client({ fetchAllMembers: true, intents: 32767 });

guardClient.on("ready", () => {
  console.log(`(${guardClient.user.username}) adlı destekçi hesapta [${guardClient.guilds.cache.get(Config.guildID).name}] adlı sunucuda giriş yapıldı.`);

  setInterval(() => {
    const oynuyor = Config.BotDurum;
    const index = Math.floor(Math.random() * (oynuyor.length));

    guardClient.user.setActivity(`${oynuyor[index]}`, {
      type: "STREAMING",
      url: "https://www.twitch.tv/jaylenozi"});

  }, 10000);

  guardClient.Busy = false;
  guardClient.Uj = 0;
  Bots.push(guardClient);

  guardClient.queryManager = new QueryManager();
  guardClient.queryManager.init(Config.Guard.TaskDelay); 
});

await guardClient.login(token).then(e => {}).catch(e => {console.error(`${token.substring(Math.floor(token.length / 2))} adlı bota giriş yapılırken başarısız olundu!.`)})
});

//#jaylen Rol Koruma

RoleGuard.on("guildMemberUpdate", async (oldMember, newMember) => {
    if (oldMember.roles.cache.size != newMember.roles.cache.size) {
        let diffRoles = newMember.roles.cache.filter(o => !oldMember.roles.cache.has(o.id));
        let perms = Config.StaffPerm
        if (!diffRoles.some(e => perms.some(perm => e.permissions.has(perm)))) {
            return;
        }
        let logs = await oldMember.guild.fetchAuditLogs({
            limit: 1,
            type: "MEMBER_ROLE_UPDATE"
        });
        let entry = logs.entries.first();
        if (!entry || entry.executor.bot || await checkPermission(RoleGuard, entry.executor.id, "full") || await checkPermission(RoleGuard, entry.executor.id, "role") || await checkPermission(RoleGuard, entry.executor.id, "roleandchannel")) return;
        let member = await oldMember.guild.members.fetch(entry.executor.id).then(m => m).catch(() => undefined);
        if (member && member.bannable) {
            await cezaVer(RoleGuard, member.id, "jail")
        }
        newMember.roles.set(oldMember.roles.cache.map(r => r.id));

        const ozi = new MessageEmbed()
        .setColor("000001")
        .setThumbnail(entry.executor.avatarURL({ dynamic: true }))
        .setDescription(`
${entry.executor} üyesi izinsiz yönetici rolü verdi ve üyeden rolü alıp, rolü veren kişiyi banladım.
─────────────────────
Yetkili: (${entry.executor} - \`${entry.executor.id}\`)
Kullanıcı: ${newMember.user} - \`${newMember.id}\`
─────────────────────
Tarih: \`${moment(Date.now()).format("LLL")}\``)

return sendLog({ embeds: [ozi] })
    }
});

let roleCreateLimit = {};
RoleGuard.on("roleCreate", async (role) => {
    let logs = await role.guild.fetchAuditLogs({
        type: "ROLE_CREATE"
    });
    let entry = logs.entries.first();
    if (!entry || entry.executor.bot || await checkPermission(RoleGuard, entry.executor.id, "full") || await checkPermission(RoleGuard, entry.executor.id, "role") || await checkPermission(RoleGuard, entry.executor.id, "roleandchannel")) return;
    if (!roleCreateLimit[entry.executor.id]) roleCreateLimit[entry.executor.id] = 0;
    if (roleCreateLimit[entry.executor.id] && roleCreateLimit[entry.executor.id] >= Config.Limit.RoleCreate) {
        roleCreateLimit[entry.executor.id] = 0;
        cezaVer(RoleGuard, entry.executor.id, "jail");
        role.delete({
            reason: "Role Guard"
        })

        const ozi = new MessageEmbed()
        .setColor("000001")
        .setThumbnail(entry.executor.avatarURL({ dynamic: true }))
        .setDescription(`
${entry.executor} üyesi **${Config.Limit.RoleCreate}** limitinden fazla rol açmayı denediği için jaile attım.
─────────────────────
Yetkili: (${entry.executor} - \`${entry.executor.id}\`)
─────────────────────
Tarih: \`${moment(Date.now()).format("LLL")}\``)

return sendLog({ embeds: [ozi] });
    };
    roleCreateLimit[entry.executor.id] += 1;
    setTimeout(() => {
        roleCreateLimit[entry.executor.id] = 0;
    }, 1000 * 60 * 3);

    const ozi = new MessageEmbed()
    .setColor("000001")
    .setThumbnail(entry.executor.avatarURL({ dynamic: true }))
    .setDescription(`
${entry.executor} üyesinin geriye kalan rol açma limiti: **${roleCreateLimit[entry.executor.id]}/${Config.Limit.RoleCreate}**.
─────────────────────
Yetkili: (${entry.executor} - \`${entry.executor.id}\`)
─────────────────────
Tarih: \`${moment(Date.now()).format("LLL")}\``)

return sendLog({ embeds: [ozi] });
});


RoleGuard.on("roleUpdate", async (oldRole, newRole) => {
let entry = await newRole.guild.fetchAuditLogs({ type: 'ROLE_UPDATE' }).then(audit => audit.entries.first());

if (entry.executor.bot) return;
if (!entry || !entry.executor || await checkPermission(RoleGuard, entry.executor.id, "full") || await checkPermission(RoleGuard, entry.executor.id, "role") || await checkPermission(RoleGuard, entry.executor.id, "roleandchannel")) return;

newRole.edit(oldRole)
cezaVer(RoleGuard, entry.executor.id, "jail");

});

const RoleChannelData = {};
let secenek = false;

RoleGuard.on("roleDelete", async (role) => {
        let veri = await SafeMember.findOne({
        guildID: role.guild.id
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
    secenek = false;
    RoleChannelData[role.id] = "wait";
    let logs = await role.guild.fetchAuditLogs({
        limit: 1,
        type: "ROLE_DELETE"
    });
    let entry = logs.entries.first();

   if (entry.executor.bot) return;
    if ((!entry || await checkPermission(RoleGuard, entry.executor.id, "full") || await checkPermission(RoleGuard, entry.executor.id, "role") || await checkPermission(RoleGuard, entry.executor.id, "roleandchannel")) && !veri.SafeRole.includes(role.id)) {
        RoleChannelData[role.id] = "ignore";
        const ozi = new MessageEmbed()
        .setColor("000001")
        .setThumbnail(entry.executor.avatarURL({ dynamic: true }))
        .setDescription(`
${entry.executor} üyesi rol sildi, güvenli listede bulunduğu için işlem yapmadım.
─────────────────────
Yetkili: (${entry.executor} - \`${entry.executor.id}\`)
Silinen Rol: ${role.name} - \`${role.id}\`
─────────────────────
Tarih: \`${moment(Date.now()).format("LLL")}\``)

return sendLog({ embeds: [ozi] });
    }

    /**
     * @type {GuildMember}
     */
    let member = await role.guild.members.fetch(entry.executor.id).then(m => m).catch(() => undefined);
    let memb = role.guild.members.cache.get(entry.executor.id)
    if (member && member.bannable) {
      cezaVer(RoleGuard, member.id, "ban")
    }
    

let data = await RoleModel.findOne({ guildID: role.guild.id, roleID: role.id })

    const newRole = await role.guild.roles.create({
        name: data.name,
        color: data.color,
        hoist: data.hoist,
        permissions: data.permissions,
        position: data.position,
        mentionable: data.mentionable,
        reason: "Rol Silindiği İçin Tekrar Oluşturuldu!"
      });
      RoleChannelData[role.id] = newRole.id;

      let kanalPermVeri = data.channelOverwrites.filter(e => RoleGuard.guilds.cache.get(Config.guildID).channels.cache.get(e.id))
      if (kanalPermVeri) kanalPermVeri.forEach((perm, index) => {
        let kanal = role.guild.channels.cache.get(perm.id);
        if (!kanal) return;
        setTimeout(() => {
          let yeniKanalPermVeri = {};
          perm.allow.forEach(p => {
            yeniKanalPermVeri[p] = true;
          });
          perm.deny.forEach(p => {
            yeniKanalPermVeri[p] = false;
          });
          kanal.permissionOverwrites.create(newRole, yeniKanalPermVeri).catch(console.error);
        }, index * 5000);
      });

     await RoleModel.updateOne({ guildID: role.guild.id, roleID: role.id }, { $set: { roleID: newRole.id }})

     let length = data.members.length;
     let clientsCount = Bots.length
     let clients = getClients(clientsCount);

     if (!data || length <= 0) {
        const ozi = new MessageEmbed()
        .setColor("000001")
        .setThumbnail(entry.executor.avatarURL({ dynamic: true }))
        .setDescription(`
${entry.executor} üyesi rol sildi, sunucudan yasakladım ancak silinen rol için bir veri olmadığı için hiçbir şey yapamadım.
─────────────────────
Yetkili: (${entry.executor} - \`${entry.executor.id}\`)
Silinen Rol: ${role.name} - \`${role.id}\`
─────────────────────
Tarih: \`${moment(Date.now()).format("LLL")}\``)

return sendLog({ embeds: [ozi] });
    }
    

    let availableBots = global.Bots.filter(e => !e.Busy);
    if (availableBots.length <= 0) availableBots = global.Bots.sort((x, y) => y.Uj - x.Uj).slice(0, Math.round(length / global.Bots.length));
    let perAnyBotMembers = Math.floor(length / availableBots.length);
    if (perAnyBotMembers < 1) perAnyBotMembers = 1;
    for (let index = 0; index < availableBots.length; index++) {
        const bot = availableBots[index];
        let ids = data.members.slice(index * perAnyBotMembers, (index + 1) * perAnyBotMembers);
        if (ids.length <= 0) { processBot(bot, false, -perAnyBotMembers); break; }
        let guild = bot.guilds.cache.get(Config.guildID); 
        ids.every(async id => {
        let member = guild.members.cache.get(id);
        if(!member){
        console.log(`Oto Silinen Rol Kurulumundan sonra ${bot.user.username} - ${id} adlı üyeyi sunucuda bulamadım.`);
        return true;}
        await member.roles.add(newRole.id).then(e => {console.log(`Oto Silinen Rol kurulumundan sonra ${bot.user.tag} - ${member.user.username} adlı üye ${newRole.name} rolünü aldı.`);}).catch(e => {console.log(`[${newRole.id}] Olayından sonra ${bot.user.username} - ${member.user.username} adlı üyeye rol veremedim.`);});});
         processBot(bot, false, -perAnyBotMembers); }

            const ozi = new MessageEmbed()
            .setColor("000001")
            .setThumbnail(entry.executor.avatarURL({ dynamic: true }))
            .setDescription(`
${entry.executor} üyesi rol sildi, sunucudan ${entry.executor.bannable ? "yasakladım" : "yasaklayamadım"}.
─────────────────────
Yetkili: (${entry.executor} - \`${entry.executor.id}\`)
Silinen Rol: ${role.name} - \`${role.id}\`
**Aktif İşlem;**
\`\`\`cs
Role sahip ${data.members.length} üye ${clients.length}'ı bot üye olmak üzere rolü destekçiler ile birlikte dağıtmaya başlıyorum
İşlemin biteceği tahmini süre: ${(length>1000 ? parseInt((length*(Config.Guard.GiveRoleDelay/1000)) / 60)+" dakika" : parseInt(length*(Config.Guard.GiveRoleDelay/1000))+" saniye")}
\`\`\`
─────────────────────
Tarih: \`${moment(Date.now()).format("LLL")}\``)
    
    sendLog({ embeds: [ozi] });
   
});

//#endjaylen

//#jaylen Kanal Koruma

ChannelGuard.on("channelDelete", async (channel) => {

    let logs = await channel.guild.fetchAuditLogs({
        limit: 1,
        type: "CHANNEL_DELETE"
    });
    let entry = logs.entries.first();

    if (!entry || entry.executor.bot || await checkPermission(ChannelGuard, entry.executor.id, "full") || await checkPermission(ChannelGuard, entry.executor.id, "channel") || await checkPermission(ChannelGuard, entry.executor.id, "roleandchannel")) {

if ((channel.type === 'GUILD_TEXT') || (channel.type === 'GUILD_NEWS') || (channel.type === 'GUILD_VOICE')) {

    const ozi = new MessageEmbed()
    .setColor("000001")
    .setThumbnail(entry.executor.avatarURL({ dynamic: true }))
    .setDescription(`
${entry.executor} üyesi kanal sildi, güvenli listede olduğu için işlem yapmadım.
─────────────────────
Yetkili: (${entry.executor} - \`${entry.executor.id}\`)
Silinen Kanal: ${channel.name} - \`${channel.id}\`
─────────────────────
Tarih: \`${moment(Date.now()).format("LLL")}\``)

return sendLog({ embeds: [ozi] });
} else if (channel.type === 'GUILD_CATEGORY') {

    const ozi = new MessageEmbed()
    .setColor("000001")
    .setThumbnail(entry.executor.avatarURL({ dynamic: true }))
    .setDescription(`
${entry.executor} üyesi kategori sildi, güvenli listede olduğu için işlem yapmadım.
─────────────────────
Yetkili: (${entry.executor} - \`${entry.executor.id}\`)
Silinen Kategori: ${channel.name} - \`${channel.id}\`
─────────────────────
Tarih: \`${moment(Date.now()).format("LLL")}\``)

return sendLog({ embeds: [ozi] });

}
    }

let member = await channel.guild.members.fetch(entry.executor.id).then(m => m).catch(() => undefined);
await cezaVer(ChannelGuard, member.id, "ban");

if ((channel.type === 'GUILD_TEXT') || (channel.type === 'GUILD_NEWS')) {

        const ozi = new MessageEmbed()
        .setColor("000001")
        .setThumbnail(entry.executor.avatarURL({ dynamic: true }))
        .setDescription(`
${entry.executor} üyesi kanal sildi, sunucudan yasaklayıp, silinen kanalı izinleriyle birlikte yeniden oluşturdum.
─────────────────────
Yetkili: (${entry.executor} - \`${entry.executor.id}\`)
Silinen Kanal: ${channel.name} - \`${channel.id}\`
Kanal Türü: \` Yazı Kanalı \`
─────────────────────
Tarih: \`${moment(Date.now()).format("LLL")}\``)

sendLog({ embeds: [ozi] });
} else if (channel.type === 'GUILD_VOICE') {

    const ozi = new MessageEmbed()
    .setColor("000001")
    .setThumbnail(entry.executor.avatarURL({ dynamic: true }))
    .setDescription(`
${entry.executor} üyesi kanal sildi, sunucudan yasaklayıp, silinen kanalı izinleriyle birlikte yeniden oluşturdum.
─────────────────────
Yetkili: (${entry.executor} - \`${entry.executor.id}\`)
Silinen Kanal: ${channel.name} - \`${channel.id}\`
Kanal Türü: \` Ses Kanalı \`
─────────────────────
Tarih: \`${moment(Date.now()).format("LLL")}\``)

sendLog({ embeds: [ozi] });
} else if (channel.type === 'GUILD_CATEGORY') {

    const ozi = new MessageEmbed()
    .setColor("000001")
    .setThumbnail(entry.executor.avatarURL({ dynamic: true }))
    .setDescription(`
${entry.executor} üyesi kategori sildi, sunucudan yasaklayıp, silinen kategoriyi izinleriyle birlikte yeniden oluşturup kanallarını içine taşıdım.
─────────────────────
Yetkili: (${entry.executor} - \`${entry.executor.id}\`)
Silinen Kategori: ${channel.name} - \`${channel.id}\`
─────────────────────
Tarih: \`${moment(Date.now()).format("LLL")}\``)

sendLog({ embeds: [ozi] });
}

const tdata = await TextChannels.findOne({ channelID: channel.id });
const vdata = await VoiceChannels.findOne({ channelID: channel.id });
const cdata = await CategoryChannels.findOne({ channelID: channel.id });

let newChannel;
if ((channel.type === 'GUILD_TEXT') || (channel.type === 'GUILD_NEWS')) {
    newChannel = await channel.guild.channels.create(channel.name, {
    type: channel.type,
    topic: channel.topic,
    nsfw: channel.nsfw,
    parent: channel.parent,
    position: tdata.position + 1,
    rateLimitPerUser: channel.rateLimitPerUser
  });
  await TextChannels.updateMany({ channelID: channel.id }, { channelID: newChannel.id });
}
if (channel.type === 'GUILD_VOICE') {
  newChannel = await channel.guild.channels.create(channel.name, {
    type: channel.type,
    bitrate: channel.bitrate,
    userLimit: channel.userLimit,
    parent: channel.parent,
    position: vdata.position
  });
  await VoiceChannels.updateMany({ channelID: channel.id }, { channelID: newChannel.id });
}
if (channel.type === 'GUILD_CATEGORY') {
    if (!channel.id) return;
     if (!cdata) return;
        const newChannel2 = await channel.guild.channels.create(cdata.name, {
          type: 'GUILD_CATEGORY',
          position: cdata.position + 1,
        });
        const textChannels = await TextChannels.find({ parentID: channel.id });
        await TextChannels.updateMany({ parentID: channel.id }, { parentID: newChannel2.id });
        textChannels.forEach(c => {
          const textChannel = channel.guild.channels.cache.get(c.channelID);
          if (textChannel) textChannel.setParent(newChannel2, { lockPermissions: false });
        });
        const voiceChannels = await VoiceChannels.find({ parentID: channel.id });
        await VoiceChannels.updateMany({ parentID: channel.id }, { parentID: newChannel2.id });
        voiceChannels.forEach(c => {
          const voiceChannel = channel.guild.channels.cache.get(c.channelID);
          if (voiceChannel) voiceChannel.setParent(newChannel2, { lockPermissions: false });
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
        await newChannel2.permissionOverwrites.set(newOverwrite);
        await VoiceChannels.updateMany({ channelID: channel.id }, { channelID: newChannel.id });

    return };

channel.permissionOverwrites.cache.forEach(perm => {
    let thisPermOverwrites = {};
    perm.allow.toArray().forEach(p => {
      thisPermOverwrites[p] = true;
    });
    perm.deny.toArray().forEach(p => {
      thisPermOverwrites[p] = false;
    });
    newChannel.permissionOverwrites.create(perm.id, thisPermOverwrites);
  });

});


ChannelGuard.on("channelUpdate", async (oldChannel, newChannel) => {
let entry = await newChannel.guild.fetchAuditLogs({ type: 'CHANNEL_OVERWRITE_UPDATE' }).then(audit => audit.entries.first());
if (entry.executor.bot) return;

if (!entry || !entry.executor || !newChannel.guild.channels.cache.has(newChannel.id) || await checkPermission(ChannelGuard, entry.executor.id, "full") || await checkPermission(ChannelGuard, entry.executor.id, "channel") || await checkPermission(RoleGuard, entry.executor.id, "roleandchannel")) return;

await newChannel.permissionOverwrites.set([...oldChannel.permissionOverwrites.cache.values()]);
cezaVer(ChannelGuard, entry.executor.id, "jail");

});


let channelCreateLimit = {};
ChannelGuard.on("channelCreate", async (channel) => {
    let logs = await channel.guild.fetchAuditLogs({
        type: "CHANNEL_CREATE"
    });
    let entry = logs.entries.first();
    if (!entry || entry.executor.bot || await checkPermission(ChannelGuard, entry.executor.id, "full") || await checkPermission(ChannelGuard, entry.executor.id, "channel") || await checkPermission(ChannelGuard, entry.executor.id, "roleandchannel")) return;
    if (!channelCreateLimit[entry.executor.id]) channelCreateLimit[entry.executor.id] = 0;
    if (channelCreateLimit[entry.executor.id] >= Config.Limit.ChannelCreate) {
        cezaVer(ChannelGuard, entry.executor.id, "jail");
        channelCreateLimit[entry.executor.id] = 0;

        const ozi = new MessageEmbed()
        .setColor("000001")
        .setThumbnail(entry.executor.avatarURL({ dynamic: true }))
        .setDescription(`
${entry.executor} üyesi **${Config.Limit.ChannelCreate}** limitinden fazla kanal açmayı denediği için jaile attım.
─────────────────────
Yetkili: (${entry.executor} - \`${entry.executor.id}\`)
─────────────────────
Tarih: \`${moment(Date.now()).format("LLL")}\``)

return sendLog({ embeds: [ozi] });

    }
    channelCreateLimit[entry.executor.id] += 1;
    setTimeout(() => {
        channelCreateLimit[entry.executor.id] = 0;
    }, 1000 * 60 * 3);

    const ozi = new MessageEmbed()
    .setColor("000001")
    .setThumbnail(entry.executor.avatarURL({ dynamic: true }))
    .setDescription(`
${entry.executor} üyesinin geriye kalan kanal açma limiti: **${channelCreateLimit[entry.executor.id]}/${Config.Limit.ChannelCreate}**.
─────────────────────
Yetkili: (${entry.executor} - \`${entry.executor.id}\`)
─────────────────────
Tarih: \`${moment(Date.now()).format("LLL")}\``)

return sendLog({ embeds: [ozi] });
});

//#endjaylen

//#jaylen Harici Koruma

let BanLimit = {};

OtherGuard.on("guildBanAdd", async (orospu) => {
    const logs = await orospu.guild.fetchAuditLogs({
        type: "MEMBER_BAN_ADD"
    });
    /**
     * @type {GuildAuditLogsEntry}
     */
    let entry = logs.entries.first();

    if (!logs || !entry || entry.executor.bot || await checkPermission(OtherGuard, entry.executor.id, "full") || await checkPermission(OtherGuard, entry.executor.id, "banandkick") || await checkPermission(OtherGuard, entry.executor.id, "roleandchannel")) return;
    if (entry.executor.id === orospu.user.id) return;

    let victimMember = await orospu.guild.members.fetch(entry.executor.id).then(m => m).catch(() => undefined);
    if (BanLimit[entry.executor.id] && BanLimit[entry.executor.id].Now + 1 > Config.Limit.Ban) {
        orospu.guild.members.unban(orospu.user.id);
        if (victimMember && victimMember.bannable) {
            BanLimit[entry.executor.id] = {
                Now: 1,
                Last: Date.now()
            }
            await cezaVer(OtherGuard, victimMember.id, "ban")
        }
        BanLimit[entry.executor.id].Now += 1;

        const ozi = new MessageEmbed()
        .setColor("000001")
        .setThumbnail(entry.executor.avatarURL({ dynamic: true }))
        .setDescription(`
${entry.executor} yetkilisi **${Config.Limit.Ban}** Ban limitini geçtiği için kendisi banlandı ve banlanan üyenin banı kaldırıldı.
─────────────────────
Yetkili: (${entry.executor} - \`${entry.executor.id}\`)
Kullanıcı: \`${orospu.user.tag}\` - \`${orospu.user.id}\`
─────────────────────
Tarih: \`${moment(Date.now()).format("LLL")}\``)

return sendLog({ embeds: [ozi] });
    } else if (!BanLimit[entry.executor.id]) {
        BanLimit[entry.executor.id] = {
            Now: 1,
            Last: Date.now()
        };

        const ozi = new MessageEmbed()
        .setColor("000001")
        .setThumbnail(entry.executor.avatarURL({ dynamic: true }))
        .setDescription(`
${entry.executor} yetkilisi kalan Ban Limit: **${1}/${Config.Limit.Ban}**.
─────────────────────
Yetkili: (${entry.executor} - \`${entry.executor.id}\`)
Kullanıcı: \`${orospu.user.tag}\` - \`${orospu.user.id}\`
─────────────────────
Tarih: \`${moment(Date.now()).format("LLL")}\``)

return sendLog({ embeds: [ozi] });
    } else {
        BanLimit[entry.executor.id].Now += 1;
        setTimeout(() => {
            BanLimit[entry.executor.id] = {
                Now: 1,
                Last: Date.now()
            }
        }, 1000 * 60 * 3);

        const ozi = new MessageEmbed()
        .setColor("000001")
        .setThumbnail(entry.executor.avatarURL({ dynamic: true }))
        .setDescription(`
${entry.executor} yetkilisi kalan Ban Limit: **${BanLimit[entry.executor.id].Now}/${Config.Limit.Ban}**.
─────────────────────
Yetkili: (${entry.executor} - \`${entry.executor.id}\`)
Kullanıcı: \`${orospu.user.tag}\` - \`${orospu.user.id}\`
─────────────────────
Tarih: \`${moment(Date.now()).format("LLL")}\``)

return sendLog({ embeds: [ozi] });
    }
});

let KickLimit = {};

OtherGuard.on("guildMemberRemove", async (member) => {

    let entry = await member.guild.fetchAuditLogs({type: 'MEMBER_KICK'}).then(audit => audit.entries.first());
    if (!entry || !entry.executor || Date.now()-entry.createdTimestamp > 5000 || entry.executor.bot || await checkPermission(OtherGuard, entry.executor.id, "full") || await checkPermission(OtherGuard, entry.executor.id, "banandkick") || await checkPermission(OtherGuard, entry.executor.id, "roleandchannel")) return;
    if (entry.executor.id === member.id) return;

    let victimMember = await member.guild.members.fetch(entry.executor.id).then(m => m).catch(() => undefined);
    if (KickLimit[entry.executor.id] && KickLimit[entry.executor.id].Now + 1 > Config.Limit.Kick) {
        if (victimMember && victimMember.bannable) {
            KickLimit[entry.executor.id] = {
                Now: 1,
                Last: Date.now()
            }
            await cezaVer(OtherGuard, victimMember.id, "ban")
        }
        KickLimit[entry.executor.id].Now += 1;
        const ozi = new MessageEmbed()
        .setColor("000001")
        .setThumbnail(entry.executor.avatarURL({ dynamic: true }))
        .setDescription(`
${entry.executor} yetkilisi **${Config.Limit.Kick}** Kick limitini geçtiği için sunucudan banlandı.
─────────────────────
Yetkili: (${entry.executor} - \`${entry.executor.id}\`)
Kullanıcı: \`${member.user.tag}\` - \`${member.user.id}\`
─────────────────────
Tarih: \`${moment(Date.now()).format("LLL")}\``)

return sendLog({ embeds: [ozi] });
    } else if (!KickLimit[entry.executor.id]) {
        KickLimit[entry.executor.id] = {
            Now: 1,
            Last: Date.now()
        };
        const ozi = new MessageEmbed()
        .setColor("000001")
        .setThumbnail(entry.executor.avatarURL({ dynamic: true }))
        .setDescription(`
${entry.executor} yetkilisi kalan Kick Limit: **${1}/${Config.Limit.Kick}**.
─────────────────────
Yetkili: (${entry.executor} - \`${entry.executor.id}\`)
Kullanıcı: \`${member.user.tag}\` - \`${member.user.id}\`
─────────────────────
Tarih: \`${moment(Date.now()).format("LLL")}\``)

return sendLog({ embeds: [ozi] });
    } else {
        KickLimit[entry.executor.id].Now += 1;
        setTimeout(() => {
            KickLimit[entry.executor.id] = {
                Now: 1,
                Last: Date.now()
            }
        }, 1000 * 60 * 3);
        const ozi = new MessageEmbed()
        .setColor("000001")
        .setThumbnail(entry.executor.avatarURL({ dynamic: true }))
        .setDescription(`
${entry.executor} yetkilisi kalan Kick Limit: **${KickLimit[entry.executor.id].Now}/${Config.Limit.Kick}**.
─────────────────────
Yetkili: (${entry.executor} - \`${entry.executor.id}\`)
Kullanıcı: \`${member.user.tag}\` - \`${member.user.id}\`
─────────────────────
Tarih: \`${moment(Date.now()).format("LLL")}\``)

return sendLog({ embeds: [ozi] });
    }
});


OtherGuard.on("guildMemberAdd", async (member) => {
    if (!member.user.bot) return;

    let logs = await member.guild.fetchAuditLogs({
        type: "BOT_ADD"
    });
    /**
     * @type {GuildAuditLogsEntry}
     */
    let entry = logs.entries.first();

    if (!entry || await checkPermission(OtherGuard, entry.executor.id, "bot")) return;

    let victimMember = await member.guild.members.fetch(entry.executor.id).then(m => m).catch(() => undefined);
    if (victimMember && victimMember.bannable) {
        await cezaVer(OtherGuard, victimMember.id, "ban")
        await cezaVer(OtherGuard, member.id, "ban")
    }

    const ozi = new MessageEmbed()
    .setColor("000001")
    .setThumbnail(entry.executor.avatarURL({ dynamic: true }))   
    .setDescription(`
${entry.executor} üyesi izinsiz sunucuya bot ekledi ve yetkiliyi banlayıp, eklenen botu banladım.
─────────────────────
Yetkili: (${entry.executor} - \`${entry.executor.id}\`)
Bot: ${member.user} - \`${member.id}\`
─────────────────────
Tarih: \`${moment(Date.now()).format("LLL")}\``)
    
return sendLog({ embeds: [ozi] });
});

const logs = require('discord-logs');
logs(OtherGuard);

let baglantiKesmeLimit = {};
let susturmaLimit = {};

OtherGuard.on("voiceStateUpdate", async (oldState, newState) => {
    let logs = await oldState.guild.fetchAuditLogs({ limit: 1, type: "MEMBER_DISCONNECT" });
    let entry = logs.entries.first();
    if (!logs || !entry.executor || await checkPermission(OtherGuard, entry.executor.id, "full") || await checkPermission(OtherGuard, entry.executor.id, "roleandchannel") || entry.executor.bot) return;
    if (newState.member.id == entry.executor.id) return;

    if (oldState.channel && !newState.channel) {
    if (!baglantiKesmeLimit[entry.executor.id]) baglantiKesmeLimit[entry.executor.id] = 0;
    if (baglantiKesmeLimit[entry.executor.id] && baglantiKesmeLimit[entry.executor.id] >= Config.Limit.BaglantiKesme) {
        baglantiKesmeLimit[entry.executor.id] = 0;
        cezaVer(OtherGuard, entry.executor.id, "jail");

        const ozi = new MessageEmbed()
        .setColor("000001")
        .setThumbnail(entry.executor.avatarURL({ dynamic: true }))   
        .setDescription(`
${entry.executor} adlı yetkili bağlantı kesme sınırını aştığı için jail'e gönderildi.
─────────────────────
Yetkili: (${entry.executor} - \`${entry.executor.id}\`)
─────────────────────
Tarih: \`${moment(Date.now()).format("LLL")}\``)
        
    return sendLog({ embeds: [ozi] });
    }};
    baglantiKesmeLimit[entry.executor.id] += 1;
    setTimeout(() => {
        baglantiKesmeLimit[entry.executor.id] = 0;
    }, 1000 * 60 * 3);
});

OtherGuard.on("voiceStateUpdate", async (oldState, newState) => {
    let logs = await oldState.guild.fetchAuditLogs({ limit: 1, type: "MEMBER_UPDATE" });
    let entry = logs.entries.first();
    if (!logs || !entry.executor || await checkPermission(OtherGuard, entry.executor.id, "full") || await checkPermission(OtherGuard, entry.executor.id, "roleandchannel") || entry.executor.bot) return;
    if (newState.member.id == entry.executor.id) return;

    if (!oldState.serverMute && newState.serverMute) {
    if (!susturmaLimit[entry.executor.id]) susturmaLimit[entry.executor.id] = 0;
    if (susturmaLimit[entry.executor.id] && susturmaLimit[entry.executor.id] >= Config.Limit.Susturma) {
        susturmaLimit[entry.executor.id] = 0;
        cezaVer(OtherGuard, entry.executor.id, "jail");
        const ozi = new MessageEmbed()
        .setColor("000001")
        .setThumbnail(entry.executor.avatarURL({ dynamic: true }))   
        .setDescription(`
${entry.executor} adlı yetkili sağ-tık susturma sınırını aştığı için jail'e gönderildi.
─────────────────────
Yetkili: (${entry.executor} - \`${entry.executor.id}\`)
─────────────────────
Tarih: \`${moment(Date.now()).format("LLL")}\``)
        
    return sendLog({ embeds: [ozi] });
    }};
    susturmaLimit[entry.executor.id] += 1;
    setTimeout(() => {
        susturmaLimit[entry.executor.id] = 0;
    }, 1000 * 60 * 3);
});

OtherGuard.on("guildUpdate", async (oldGuild, newGuild) => {
    let entry = await newGuild.fetchAuditLogs({
        type: 'GUILD_UPDATE',
        limit: 1
    }).then(audit => audit.entries.first());
    if(oldGuild.vanityURLCode === newGuild.vanityURLCode) return;   

    if (newGuild.vanityURLCode !== Config.ServerURL) {
        let random = Config.Guards[Math.floor(Math.random() * Config.Guards.length)];
        request({
            url: `https://discord.com/api/v6/guilds/${Config.guildID}/vanity-url`,
            body: {
                code: Config.ServerURL
            },
            json: true,
            method: 'PATCH',
            headers: {
                "Authorization": `Bot ${random}`
            }
        });
        cezaVer(OtherGuard, entry.executor.id, "ban");
    }
    if (!entry || entry.executor.bot) return;
    const ozi = new MessageEmbed()
    .setColor("000001")
    .setThumbnail(entry.executor.avatarURL({ dynamic: true }))   
    .setDescription(`
${entry.executor} adlı yetkili URL'yi Elledi ${entry.executor.bannable ? "ve sunucudan banlayıp urlyi spamladım" : "yetkim yetmediği için banlayamadım"}.
─────────────────────
Yetkili: (${entry.executor} - \`${entry.executor.id}\`)
─────────────────────
Tarih: \`${moment(Date.now()).format("LLL")}\``)
    
return sendLog({ content: `@here`, embeds: [ozi] });

});

OtherGuard.on("ready", () => {
const guild = OtherGuard.guilds.cache.get(Config.guildID)
let random = Config.Guards[Math.floor(Math.random() * Config.Guards.length)];

setInterval(async () => {
if(guild.vanityURLCode == Config.ServerURL) {
return } else {
jaylenozi(Config.ServerURL, Config.guildID, `${random}`)
}}, 1 * 500)})


OtherGuard.on("guildUpdate", async (oldGuild, newGuild) => {
    let entry = await newGuild.fetchAuditLogs({
        type: 'GUILD_UPDATE',
        limit: 1
    }).then(audit => audit.entries.first());

    if (!entry || entry.executor.bot || await checkPermission(OtherGuard, entry.executor.id, "full") || await checkPermission(OtherGuard, entry.executor.id, "roleandchannel")) return;
    cezaVer(OtherGuard, entry.executor.id, "jail");

    if(newGuild.name !== oldGuild.name) newGuild.setName(oldGuild.name);
    newGuild.setIcon(oldGuild.iconURL({dynamic: true, size: 2048}));

    const ozi = new MessageEmbed()
    .setColor("000001")
    .setThumbnail(entry.executor.avatarURL({ dynamic: true }))   
    .setDescription(`
${entry.executor} adlı yetkili Sunucu Ayarlarını Elledi, sunucuyu eski haline getirdim ve kullanıcıyı jail attım.
─────────────────────
Yetkili: (${entry.executor} - \`${entry.executor.id}\`)
─────────────────────
Tarih: \`${moment(Date.now()).format("LLL")}\``)
    
return sendLog({ embeds: [ozi] });

});


OtherGuard.on("webhookUpdate", async (channel) => {
    let logs = await channel.guild.fetchAuditLogs({
        limit: 1,
        type: "WEBHOOK_CREATE"
    });
    let entry = logs.entries.first();
    if (!entry || entry.executor.bot || await checkPermission(OtherGuard, entry.executor.id, "bot")) return;
    cezaVer(OtherGuard, entry.executor.id, "jail");

    const webhooks = await channel.fetchWebhooks();
    await webhooks.map(x => x.delete({reason: "Guard Webhook Silindi!"}))

    const ozi = new MessageEmbed()
    .setColor("000001")
    .setThumbnail(entry.executor.avatarURL({ dynamic: true }))   
    .setDescription(`
${entry.executor} üyesi tarafından sunucuda izinsiz webhook açıldı, webhook silindi ve yetkili jail atıldı.
─────────────────────
Yetkili: (${entry.executor} - \`${entry.executor.id}\`)
─────────────────────
Tarih: \`${moment(Date.now()).format("LLL")}\``)
    
 sendLog({ embeds: [ozi] });
});

OtherGuard.on("webhookUpdate", async (channel) => {
    let logs = await channel.guild.fetchAuditLogs({
        limit: 1,
        type: "WEBHOOK_DELETE"
    });
    let entry = logs.entries.first();
    if (!entry || entry.executor.bot || await checkPermission(OtherGuard, entry.executor.id, "bot")) return;
    cezaVer(OtherGuard, entry.executor.id, "jail");

    const ozi = new MessageEmbed()
    .setColor("000001")
    .setThumbnail(entry.executor.avatarURL({ dynamic: true }))   
    .setDescription(`
${entry.executor} üyesi tarafından sunucuda izinsiz webhook silindi, kullanıcı jail atıldı.
─────────────────────
Yetkili: (${entry.executor} - \`${entry.executor.id}\`)
─────────────────────
Tarih: \`${moment(Date.now()).format("LLL")}\``)
    
 sendLog({ embeds: [ozi] });
});

OtherGuard.on("emojiDelete", async (emoji) => {
    let logs = await emoji.guild.fetchAuditLogs({
        limit: 1,
        type: "EMOJI_DELETE"
    });
    let entry = logs.entries.first();
    if (!entry || await checkPermission(OtherGuard, entry.executor.id, "full") || await checkPermission(OtherGuard, entry.executor.id, "roleandchannel")) return;
    cezaVer(OtherGuard, entry.executor.id, "jail");
    emoji.guild.emojis.create(`${emoji.url}`, `${emoji.name}`).catch(console.error);

    const ozi = new MessageEmbed()
    .setColor("000001")
    .setThumbnail(entry.executor.avatarURL({ dynamic: true }))   
    .setDescription(`
${entry.executor} üyesi izinsiz emoji sildi ve kullanıcıyı karantina atıp, emojiyi yeniden yükledim.
─────────────────────
Yetkili: (${entry.executor} - \`${entry.executor.id}\`)
Emoji: \`${emoji.name}\` - \`${emoji.id}\`
─────────────────────
Tarih: \`${moment(Date.now()).format("LLL")}\``)
    
 sendLog({ embeds: [ozi] });
});
//#endjaylen

//#chat guard

let reklamLimit = {};
OtherGuard.on("messageCreate", async (message) => {
    if (message.author.bot || message.channel.type == "dm") return;
    if (await checkPermission(OtherGuard, message.author.id, "full") || await checkPermission(OtherGuard, message.author.id, "chatguard")) return;
    let messages = [...message.channel.messages.cache.values()];
    messages = messages.splice(messages.length - 10, messages.length);
    let ms = messages.filter(e => e.cleanContent == message.cleanContent && e.author.id == message.author.id);
    const kelime = ["discord.gg", "discord.me", "discordapp.com", "discord.io", "discord.tk", ".gg/", ".gg"];
    let links = message.content.match(/(http[s]?:\/\/)(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-z]{2,6}?\b([-a-zA-Z0-9@:%_+.~#?&/=]*)/gi);
    if (ms.length > 5 && !["game","owo","fun","kamp-ateşi-chat","konser-chat"].some(ver => message.channel.name.includes(ver))) {
        ms.forEach(m => m.delete().catch(() => {}));
        message.member.roles.add(Config.MuteRole);
        message.reply({ content: `Sohbet kanallarını kirletme sebebiyle \`3 dakika\` süresince susturuldunuz, mesajlar temizlendi. Lütfen yavaşlayın. ${message.author}`});
        setTimeout(() => {
            if (!message.member.roles.cache.has(Config.MuteRole)) return;
            message.member.roles.remove(Config.MuteRole);
            message.reply({ ontent: `Sohbet kanallarını kirletme sebebiyle 3 dakika süresince susturmanız bitti. Lütfen tekrarlamayınız. ${message.author}`});
        }, 1000 * 60 * 3);
        return;
    }
    if ((message.mentions.members.size >= Config.Limit.Etiket || message.mentions.roles.size >= Config.Limit.Etiket || message.mentions.channels.size >= Config.Limit.Etiket)) {
        message.delete().catch(() => {});
    message.member.roles.add(Config.MuteRole);
    message.channel.send({ content: `Birden çok kişiyi etiketlediğin için \`15 dakika\` boyunca susturuldun. ${message.author}`});
    setTimeout(() => {
        if (!message.member.roles.cache.has(Config.MuteRole)) return;
        message.member.roles.remove(Config.MuteRole);
        message.channel.send({ content: `Birden çok kişiyi etiketleme sebebiyle olan, Muten açıldı lütfen tekrar insanları etiketleme. ${message.author}`});
    }, 1000 * 60 * 15);
}

    let args = message.content.split(" ");
    const kufurler = Config.Küfürler;
    if (kufurler.some(word => args.some(c => word.toLowerCase() == c.toLowerCase())) && !["t-sustum"].some(ver => message.channel.name.includes(ver))) {
        
		message.delete();
        message.channel.send({ content: `Güzel kardeşim küfür senin o güzel diline hiç yakışıyormu ayıp. ${message.author}`}).then((e) => setTimeout(() => { e.delete(); }, 5000)).catch(err => {});
		
    }
    
    if (kelime.some(reklam => message.content.toLowerCase().includes(reklam)) && ![message.guild.vanityURLCode].some(reklam => message.content.toLocaleLowerCase().includes(reklam))) {
        if (!reklamLimit[message.author.id]) reklamLimit[message.author.id] = 0;
        if (reklamLimit[message.author.id] && reklamLimit[message.author.id] >= 5) {
            reklamLimit[message.author.id] = 0;
            message.member.ban({
                reason: "Reklam Link Koruması"
            });
            return;
        };
        reklamLimit[message.author.id]++;
        setTimeout(() => {
            reklamLimit[message.author.id]--
        }, 1000 * 60 * 5);
        if (message.deletable) message.delete().catch(err => {});
    } else {
        if (!links) return;
        if (!reklamLimit[message.author.id]) reklamLimit[message.author.id] = 0;
        if (reklamLimit[message.author.id] && reklamLimit[message.author.id] >= 5) {
            reklamLimit[message.author.id] = 0;
            message.member.ban({
                reason: "Reklam Link Koruması"
            });
            return;
        };
        reklamLimit[message.author.id]++;
        setTimeout(() => {
            reklamLimit[message.author.id]--
        }, 1000 * 60 * 5);
        if (message.deletable) message.delete().catch(err => {});
    }
});

OtherGuard.on("messageUpdate", async (oldMessage, newMessage) => {
    if (oldMessage.author.bot || newMessage.channel.type == "dm") return;
    if (await checkPermission(OtherGuard, oldMessage.author.id, "full") || await checkPermission(OtherGuard, oldMessage.author.id, "chatguard")) return;
    const kelime = ["discord.gg", "discord.me", "discordapp.com", "discord.io", "discord.tk", ".gg/", ".gg"];
    let args = newMessage.content.split(" ");
    const kufurler = Config.Küfürler
    if (kufurler.some(word => args.some(c => word.toLowerCase() == c.toLowerCase())) && !["sus"].some(ver => newMessage.channel.name.includes(ver))) {
      newMessage.delete().then(message => {
        newMessage.channel.send({ content: `Güzel kardeşim küfür senin o güzel diline hiç yakışıyormu ayıp. ${message.author}`}).then((e) => setTimeout(() => { e.delete(); }, 5000)).catch(err => {});
      });
    }

    if (kelime.some(reklam => newMessage.content.toLowerCase().includes(reklam)) && ![newMessage.guild.vanityURLCode].some(reklam => newMessage.content.toLocaleLowerCase().includes(reklam))) {
        if (!reklamLimit[oldMessage.author.id]) reklamLimit[oldMessage.author.id] = 0;
        if (reklamLimit[oldMessage.author.id] && reklamLimit[oldMessage.author.id] >= Config.Limit.ReklamKick) {
            reklamLimit[oldMessage.author.id] = 0;
            newMessage.member.ban({
                reason: "Reklam Guard"
            });
            return;
        };
        reklamLimit[oldMessage.author.id]++;
        setTimeout(() => {
            reklamLimit[oldMessage.author.id]--
        }, 1000 * 60 * 5);
        if (newMessage.deletable) newMessage.delete().catch(err => {});
    } else {
        let links = newMessage.content.match(/(http[s]?:\/\/)(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-z]{2,6}?\b([-a-zA-Z0-9@:%_+.~#?&/=]*)/gi);
        if (!links) return;
        if (!reklamLimit[oldMessage.author.id]) reklamLimit[oldMessage.author.id] = 0;
        if (reklamLimit[oldMessage.author.id] && reklamLimit[oldMessage.author.id] >= Config.Limit.ReklamKick) {
            reklamLimit[oldMessage.author.id] = 0;
            newMessage.member.ban({
                reason: "Reklam Guard"
            });
            return;
        };
        reklamLimit[oldMessage.author.id]++;
        setTimeout(() => {
            reklamLimit[oldMessage.author.id]--
        }, 1000 * 60 * 5);
        if (newMessage.deletable) newMessage.delete().catch(err => {});
    }
});

//#end chat guard
/*
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const userRoles = require('./src/Models/SekmeKoruma');

OtherGuard.on("presenceUpdate", async (user) => {

let perms = Config.StaffPerm;
const member = OtherGuard.guilds.cache.get(Config.guildID).members.cache.get(user.userId)
const ozicik = Object.keys(user.clientStatus);

const roller = member.roles.cache.filter((e) => e.editable && e.name !== "@everyone" && perms.some(perm => e.permissions.has(perm)));
if (!member.user.bot && user.guild.id === Config.guildID && perms.some(perm => user.member.permissions.has(perm))) {
if (await checkPermission(OtherGuard, user.userId, "full") || await checkPermission(OtherGuard, user.userId, "sekmeguard")) return;

if (!ozicik.find(e => e === "web")) {
      await userRoles.updateOne({ guildID: Config.guildID, userID: user.userId }, { $set: { roles: roller.map((e) => e.id) } }, { upsert: true });
      await member.roles.remove(roller.map((e) => e.id), "Tarayıcıdan Giriş Yapıldığı İçin Rolleri Alındı.");

let ozi = new MessageEmbed()
.setDescription(`Şüpheli Kullanıcı Web Tarayıcısından Discorda Giriş Yaptı!
**Şüpheli:** <@${user.userId}> - \`(${user.userId})\`
**Sonuç:** Şüphelinin Yetki İçeren Rolleri Alındı.
\n**Rollerin Listesi:** \n${roller.map((e) => `<@&${e.id}>`).join("\n")}`)
.setThumbnail(member.displayAvatarURL({ dynamic: true, size: 2048 }))
.setAuthor({ name: member.displayName, iconURL: member.avatarURL({ dynamic: true })})
.setFooter({ text: `Sekme Koruması`, iconURL: OtherGuard.guilds.cache.get(Config.guildID).iconURL({ dynamic: true })})
.setTimestamp().setColor(member.displayHexColor)
sendLog({ embeds: [ozi] }) 

    }}
});
///////////////////////////////////////////////////////////////////////////////////////////////
/** */
process.on("uncaughtException", err => {
    const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, "g"), "./");
    console.error("Beklenmedik yakalanamayan hata: ", errorMsg);
    process.exit(1);
  });
  
  process.on("unhandledRejection", err => {
    console.error("Promise Hatası: ", err);
  });
//#jaylen Fonksiyonlar

/**
 * 
 * @param {Client} client 
 * @param {String} channelName 
 * @param {String} message 
 */

const webHook = new WebhookClient({ id: Config.Logs.WebHookID, token: Config.Logs.WebHookToken });
async function sendLog(message) {
    webHook.send(message)
}
/**
 * @param {string} id 
 * @param {("role"|"channel"|"banandkick"|"bot"|"chatguard"|"roleandchannel"|"full")} type 
 * @returns {boolean}
 */
async function checkPermission(bots, id, type) {
    let member = bots.guilds.cache.first().members.cache.get(id);
    let res = await SafeMember.findOne({
        guildID: Config.guildID
    });

    if (!res) {
        res = {
            "Full": [],
            "RoleAndChannel": [],
            "Role": [],
            "Channel": [],
            "Bot": [],
            "BanAndKick": [],
            "ChatG": [],
            "SekmeG": []
        }
        await SafeMember.updateOne({
            guildID: Config.guildID
        }, {}, {
            upsert: true,
            setDefaultsOnInsert: true
        }).exec()
    } else {

        if (Config.BotOwner.some(uye => uye == member?member.id:false) || res.Full.some(uye => uye == member?member.id:false  || member ? member.roles.cache.has(uye) : false) || Bots.some(guard => guard.user.id == member?member.id:false ) || RoleGuard.user.id == member?member.id:false  || ChannelGuard.user.id == member?member.id:false  || OtherGuard.user.id == member?member.id:false ) {
            return true;
        }
        if (type == "full") {
            if (res.Full.some(uye => uye == member?member.id:false || member ? member.roles.cache.has(uye) : false)) return true;
        } else if (type == "role") {
            if (res.Role.some(uye => uye == member?member.id:false || member ? member.roles.cache.has(uye) : false)) return true;
        } else if (type == "roleandchannel") {
            if (res.RoleAndChannel.some(uye => uye == member?member.id:false || member ? member.roles.cache.has(uye) : false)) return true;
        } else if (type == "channel") {
            if (res.Channel.some(uye => uye == member?member.id:false || member ? member.roles.cache.has(uye) : false || member ? member.voice ? member.voice.channel.id == uye : false : false)) return true;
        } else if (type == "banandkick") {
            if (res.BanAndKick.some(uye => uye == member?member.id:false || member ? member.roles.cache.has(uye) : false) || res.RoleAndChannel.some(uye => uye == member?member.id:false  || member ? member.roles.cache.has(uye) : false)) return true;
        } else if (type == "bot") {
            if (res.Bot.some(uye => uye == member?member.id:false || member ? member.roles.cache.has(uye) : false)) return true;
        } else if (type == "chatguard") {
            if (res.ChatG.some(uye => uye == member?member.id:false || member ? member.roles.cache.has(uye) : false)) return true;
        } else if (type == "sekmeguard") {
            if (res.SekmeG.some(uye => uye == member?member.id:false || member ? member.roles.cache.has(uye) : false)) return true;
        } return false;
    }
}

/**
 * 
 * @param {Number} count 
 * @returns {Client[]}
 */
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function cezaVer(test, kisiID, tur) {
    let MEMBER = test.guilds.cache.get(Config.guildID).members.cache.get(kisiID);
    if (!MEMBER) return;
    if (tur == "jail") return MEMBER.roles.cache.has(Config.BoosterRole) ? MEMBER.roles.set([Config.BoosterRole, Config.JailRole]) : MEMBER.roles.set([Config.JailRole]).catch()
    if (tur == "ban") return MEMBER.ban({
        reason: "Guard Sistem Koruma"
    }).catch(console.error);
    if (tur == "kick") return MEMBER.kick().catch(console.error);;
};

async function rolbackup() {
    if(RoleModel) {await RoleModel.deleteMany({});}
    
    const guild = OtherGuard.guilds.cache.get(Config.guildID);
      let members = await guild.members.fetch();
      guild.roles.cache.forEach(async role => {
          let roleChannelOverwrites = [];
          await guild.channels.cache.filter(c => c.permissionOverwrites.cache.has(role.id)).forEach(c => {
              let channelPerm = c.permissionOverwrites.cache.get(role.id);
              let pushlanacak = {
                  id: c.id,
                  allow: channelPerm.allow.toArray(),
                  deny: channelPerm.deny.toArray()
              };
              roleChannelOverwrites.push(pushlanacak);
          });
    
          await RoleModel.updateOne({
              roleID: role.id
          }, {
              $set: {
                  guildID: guild.id,
                  roleID: role.id,
                  name: role.name,
                  color: role.hexColor,
                  hoist: role.hoist,
                  position: role.position,
                  permissions: role.permissions.bitfield,
                  mentionable: role.mentionable,
                  time: Date.now(),
                  members: role.members.map(m => m.id),
                  channelOverwrites: roleChannelOverwrites
              }
          }, {
              upsert: true
          });
      });
    
    console.log("Bütün Rol verileri başarı ile kayıt edildi.")
    };


async function kanalbackup() {
    if(TextChannels) {await TextChannels.deleteMany({});}
    if(VoiceChannels) {await VoiceChannels.deleteMany({});}
    if(CategoryChannels) {await CategoryChannels.deleteMany({});}
    
    const guild = OtherGuard.guilds.cache.get(Config.guildID);
      if (guild) {
          const channels = [...guild.channels.cache.values()];
          for (let index = 0; index < channels.length; index++) {
              const channel = channels[index];
              let ChannelPermissions = []
              channel.permissionOverwrites.cache.forEach(perm => {
                  ChannelPermissions.push({ id: perm.id, type: perm.type, allow: "" + perm.allow, deny: "" + perm.deny })
              });
            
              if ((channel.type === 'GUILD_TEXT') || (channel.type === 'GUILD_NEWS')) {
                await TextChannels.updateOne({
                    channelID: channel.id,
                }, {
                    $set: {
                        channelID: channel.id,
                        name: channel.name,
                        nsfw: channel.nsfw,
                        parentID: channel.parentId,
                        position: channel.position,
                        rateLimit: channel.rateLimitPerUser,
                        overwrites: ChannelPermissions,
                    }
                }, {
                    upsert: true
                });
              }
              if (channel.type === 'GUILD_VOICE') {
                await VoiceChannels.updateOne({
                    channelID: channel.id,
                }, {
                    $set: {
                        channelID: channel.id,
                        name: channel.name,
                        bitrate: channel.bitrate,
                        userLimit: channel.userLimit,
                        parentID: channel.parentId,
                        position: channel.position,
                        overwrites: ChannelPermissions,
                    }
                }, {
                    upsert: true
                });
              }
              if (channel.type === 'GUILD_CATEGORY') {
                await CategoryChannels.updateOne({
                    channelID: channel.id,
                }, {
                    $set: {
                        channelID: channel.id,
                        name: channel.name,
                        position: channel.position,
                        overwrites: ChannelPermissions,
                    }
                }, {
                    upsert: true
                });
              }
          }
          console.log("Bütün Kanal verileri başarı ile kayıt edildi.")
      }}

async function jaylenozi(vanity, token) {
let random = Config.Guards[Math.floor(Math.random() * Config.Guards.length)];

const spammer = {
    url: `https://discord.com/api/v8/guilds/${Config.guildID}/vanity-url`,
    body: {
    code: `${vanity}`},
    json: true,
        method: 'PATCH',
        headers: {
        "Authorization": `Bot ${random}`
        }};

request(spammer, (err, res, body) => {if (err) {return console.log(err)}})}

//#endjaylen