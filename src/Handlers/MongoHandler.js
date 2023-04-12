const ayar = require("../Configs/BotConfig.json");
const mongoose = require("mongoose");

try {
  mongoose
    .connect(ayar.mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("Database bağlantısı tamamlandı!"));
} catch (err) {
  console.error("[HATA] Database bağlantısı kurulamadı!", err);
}
