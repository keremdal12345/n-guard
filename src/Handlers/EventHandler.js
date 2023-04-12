const fs = require("fs");
const Bot = global.bot;

const eventFiles = fs
  .readdirSync("./src/Events")
  .filter((file) => file.endsWith(".js"));

try {
  for (const file of eventFiles) {
    const event = require(`../Events/${file}`);
    Bot.on(event.conf.name, event);
  }

  console.log(`[EVENTS] (${eventFiles.length}) event yüklendi!.`);
} catch (err) {
  console.error("[EVENTS] Event yüklenemedi", err);
}
