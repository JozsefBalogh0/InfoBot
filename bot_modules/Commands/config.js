const Discord = require('discord.js');
const path = require('path');
const fs = require('fs');

const settlementCollection = require('../../Data/settlements.json');

const filePath = "../../Data/Guilds";
const extension = ".json";

function write(data, fileName) {
  fs.writeFileSync(path.join(__dirname, filePath, `${fileName}${extension}`), JSON.stringify(data, null, 2), function writeJSON(err) {
    if (err) return console.log(err)
  });
}

module.exports = {
  run: async (client, message, isnew) => {
    const guild = await client.guilds.cache.get(message.guild.id);
    const targetChannel = await guild.channels.cache.get(message.channel.id);

    await message.delete();

    let isStop = false;

    //Declare Variables
    let prefix = "!";
    let AutoWeatherCity = "";

    let ClearChannel = false;
    let UseOneChannelNews = false;
    let UseOneChannelWeather = false;
    let UseAutoWeather = false;
    let IgnoreBots = false;
    let UseCommandPredict = false;

    let ClearChannelChannel = "";
    let OneNewsChannel = "";
    let OneWeatherChannel = "";
    let AutomatedWeatherChannel = "";

    let BotRole = "";

    const BoolAskEmojiArray = ["1️⃣", "2️⃣", "❌"];


    //Declare Questions
    let prefixQuestion = new Discord.MessageEmbed()
      .setColor("#0000FF")
      .setTitle("[1/7] Kérlek válassz Prefixet")
      .setDescription(`Prefix-el lehet parancsokat megadni.\nJelenlegi: ${prefix}\n\nLehetséges válaszok: [ ! @ # $ % ^ & * ( ) _ + - = { } ; : | . < > ? ~ ]\nVálasz üzenetben csak a szimbólumot írd le.`)
      .setFooter("Választásra 1 perc van. --- A konfiguráció leállításához írd le: 'Mégse'")

    let predictBoolQuestion = new Discord.MessageEmbed()
      .setColor("#0000FF")
      .setTitle("[2/7] Szeretnéd, hogy jelezzem, ha egy olyan parancsot küldenek, ami nem létezik?")
      .setDescription(`1️⃣ - Igen\n2️⃣ - Nem\n\nVálaszolni az emojikkal tudsz.`)
      .setFooter("Választásra 1 perc van. --- A konfiguráció leállításához kattints: '❌'-re")

    let botBoolQuestion = new Discord.MessageEmbed()
      .setColor("#0000FF")
      .setTitle("[3/7] A szerveren használsz más botot?")
      .setDescription(`1️⃣ - Igen és van külön bot rankjuk\n2️⃣ - Nem\n\nVálaszolni az emojikkal tudsz.`)
      .setFooter("Választásra 1 perc van. --- A konfiguráció leállításához kattints: '❌'-re")

    let botRankQuestion = new Discord.MessageEmbed()
      .setColor("#0000FF")
      .setTitle("Kérlek add meg a bot rankot")
      .setDescription(`Válasz üzenetben csak a rankot jelöld meg @ használatával`)
      .setFooter("Választásra 1 perc van. --- A konfiguráció leállításához írd le: 'Mégse'")

    let autoWeatherBoolQuestion = new Discord.MessageEmbed()
      .setColor("#0000FF")
      .setTitle("[4/7] Kérsz autómatikusan időjárás jelentéseket?")
      .setDescription(`Naponta 3-szor [6:00, 12:00, 18:00] (EST) küldök a következő kérdésben megadott városról időjárás jelentést.\n1️⃣ - Igen\n2️⃣ - Nem\n\nVálaszolni az emojikkal tudsz.`)
      .setFooter("Választásra 1 perc van. --- A konfiguráció leállításához kattints: '❌'-re")

    let autoWeatherCityQuestion = new Discord.MessageEmbed()
      .setColor("#0000FF")
      .setTitle("Kérlek add meg a város nevét")
      .setDescription(`Csak akkor megyek tovább ha a város név érvényes.\nVálasz üzenetben csak a város nevét írd le.`)
      .setFooter("Választásra 2 perc van. --- A konfiguráció leállításához írd le: 'Mégse'")

    let autoWeatherChannelQuestion = new Discord.MessageEmbed()
      .setColor("#0000FF")
      .setTitle("Melyik csatornába küldjem az időjárás jelentéseket?")
      .setDescription(`Válasz üzenetben csak a csatornát jelöld meg # használatával.`)
      .setFooter("Választásra 1 perc van. --- A konfiguráció leállításához írd le: 'Mégse'")

    let clearChannelBoolQuestion = new Discord.MessageEmbed()
      .setColor("#0000FF")
      .setTitle("[5/7] Szeretnéd, hogy minden nap [1:00]-kor (EST) töröljek egy kiválasztott csatorna tartalmát?")
      .setDescription(`1️⃣ - Igen\n2️⃣ - Nem\n\nVálaszolni az emojikkal tudsz.`)
      .setFooter("Választásra 1 perc van. --- A konfiguráció leállításához kattints: '❌'-re")

    let clearChannelQuestion = new Discord.MessageEmbed()
      .setColor("#0000FF")
      .setTitle("Melyik csatorna tartalmát töröljem?")
      .setDescription(`Válasz üzenetben csak a csatornát jelöld meg # használatával.`)
      .setFooter("Választásra 1 perc van. --- A konfiguráció leállításához írd le: 'Mégse'")

    let UseOneChannelNewsBoolQuestion = new Discord.MessageEmbed()
      .setColor("#0000FF")
      .setTitle("[6/7] Szeretnéd, hogy a parancssal lekért híreket csak egy csatornából lehessen lekérni?")
      .setDescription(`1️⃣ - Igen\n2️⃣ - Nem\n\nVálaszolni az emojikkal tudsz.`)
      .setFooter("Választásra 1 perc van. --- A konfiguráció leállításához kattints: '❌'-re")

    let UseOneChannelNewsChannelQuestion = new Discord.MessageEmbed()
      .setColor("#0000FF")
      .setTitle("Melyik csatornából lehessen lekérni a híreket?")
      .setDescription(`Válasz üzenetben csak a csatornát jelöld meg # használatával.`)
      .setFooter("Választásra 1 perc van. --- A konfiguráció leállításához írd le: 'Mégse'")

    let UseOneChannelWeatherBoolQuestion = new Discord.MessageEmbed()
      .setColor("#0000FF")
      .setTitle("[7/7] Szeretnéd, hogy a parancssal lekért időjárás jelentéseket csak egy csatornából lehessen lekérni?")
      .setDescription(`1️⃣ - Igen\n2️⃣ - Nem\n\nVálaszolni az emojikkal tudsz.`)
      .setFooter("Választásra 1 perc van. --- A konfiguráció leállításához kattints: '❌'-re")

    let UseOneChannelWeatherChannelQuestion = new Discord.MessageEmbed()
      .setColor("#0000FF")
      .setTitle("Melyik csatornából lehessen lekérni az időjárás jelentéseket?")
      .setDescription(`Válasz üzenetben csak a csatornát jelöld meg # használatával.`)
      .setFooter("Választásra 1 perc van. --- A konfiguráció leállításához írd le: 'Mégse'")


    if (isnew) {
      //Prefix
      const validPrefixes = [`[`, `!`, `@`, `#`, `$`, `%`, `^`, `&`, `*`, `(`, `)`, `_`, `+`, `-`, `=`, `[`, `]`, `{`, `}`, `;`, `:`, `|`, `.`, `<`, `>`, `?`, `~`, `]`]
      let filter = m => (validPrefixes.includes(m.content.trim()) || m.content.toLowerCase().trim() == "mégse") && m.author.id == message.author.id;
      await targetChannel.send(prefixQuestion).then(async (main) => {
        let collectedMessages;
        try {
          collectedMessages = await targetChannel.awaitMessages(filter, {
            time: 60000,
            max: 1,
            errors: ['time']
          });
        } catch (e) {
          let responseEmbed = new Discord.MessageEmbed()
            .setColor('#FF0000')
            .setTitle('Választásra hátralévő idő lejárt.')
          targetChannel.send(responseEmbed);
          main.delete();
          isStop = true;
          return;
        }
        if (collectedMessages.first().content.trim().toLowerCase() == "mégse") {
          let responseEmbed = new Discord.MessageEmbed()
            .setColor('#FFA500')
            .setTitle('Konfiguráció Leállítva.')
          targetChannel.send(responseEmbed);
          main.delete();
          isStop = true;
          return;
        }
        prefix = collectedMessages.first().content.trim();
        main.delete();
        collectedMessages.first().delete();
      });

      //predictBoolQuestion
      if (!isStop) {
        filter = (m, user) => user.id == message.author.id && (BoolAskEmojiArray.includes(m.emoji.name));
        await targetChannel.send(predictBoolQuestion).then(async (main) => {
          BoolAskEmojiArray.reduce(async (item, i) => {
            if (!main.deleted) {
              await item;
              try {
                await main.react(i);
              } catch (e) {}
            }
          }, undefined);
          let collectedReaction;
          try {
            collectedReaction = await main.awaitReactions(filter, {
              time: 60000,
              max: 1,
              errors: ['time']
            });
          } catch (e) {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle('Választásra hátralévő idő lejárt.')
            targetChannel.send(responseEmbed);
            main.delete();
            isStop = true;
            return;
          }
          if (collectedReaction.first().emoji.name == '❌') {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor('#FFA500')
              .setTitle('Konfiguráció Leállítva.')
            targetChannel.send(responseEmbed);
            main.delete();
            isStop = true;
            return;
          } else if (collectedReaction.first().emoji.name == '1️⃣') {
            UseCommandPredict = true;
          } else {
            UseCommandPredict = false;
          }
          main.delete();
        });
      }

      //BotBool
      if (!isStop) {
        filter = (m, user) => user.id == message.author.id && (BoolAskEmojiArray.includes(m.emoji.name));
        await targetChannel.send(botBoolQuestion).then(async (main) => {
          BoolAskEmojiArray.reduce(async (item, i) => {
            if (!main.deleted) {
              await item;
              try {
                await main.react(i);
              } catch (e) {}
            }
          }, undefined);
          let collectedReaction;
          try {
            collectedReaction = await main.awaitReactions(filter, {
              time: 60000,
              max: 1,
              errors: ['time']
            });
          } catch (e) {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle('Választásra hátralévő idő lejárt.')
            targetChannel.send(responseEmbed);
            main.delete();
            isStop = true;
            return;
          }
          if (collectedReaction.first().emoji.name == '❌') {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor('#FFA500')
              .setTitle('Konfiguráció Leállítva.')
            targetChannel.send(responseEmbed);
            main.delete();
            isStop = true;
            return;
          } else if (collectedReaction.first().emoji.name == '1️⃣') {
            IgnoreBots = true;
          } else {
            IgnoreBots = false;
          }
          main.delete();
        });
      }

      if (!isStop && IgnoreBots == true) {
        //botRank
        filter = m => (m.mentions.roles.first() || m.content.toLowerCase().trim() == "mégse") && m.author.id == message.author.id;
        await targetChannel.send(botRankQuestion).then(async (main) => {
          let collectedMessages;
          try {
            collectedMessages = await targetChannel.awaitMessages(filter, {
              time: 60000,
              max: 1,
              errors: ['time']
            });
          } catch (e) {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle('Választásra hátralévő idő lejárt.')
            targetChannel.send(responseEmbed);
            main.delete();
            isStop = true;
            return;
          }
          if (collectedMessages.first().content.trim().toLowerCase() == "mégse") {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor('#FFA500')
              .setTitle('Konfiguráció Leállítva.')
            targetChannel.send(responseEmbed);
            main.delete();
            isStop = true;
            return;
          }
          BotRole = collectedMessages.first().mentions.roles.first().id;
          main.delete();
          collectedMessages.first().delete();
        });
      }

      if (!isStop) {
        //autoWeatherBoolQuestion
        filter = (m, user) => user.id == message.author.id && (BoolAskEmojiArray.includes(m.emoji.name));
        await targetChannel.send(autoWeatherBoolQuestion).then(async (main) => {
          BoolAskEmojiArray.reduce(async (item, i) => {
            if (!main.deleted) {
              await item;
              try {
                await main.react(i);
              } catch (e) {}
            }
          }, undefined);
          let collectedReaction;
          try {
            collectedReaction = await main.awaitReactions(filter, {
              time: 60000,
              max: 1,
              errors: ['time']
            });
          } catch (e) {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle('Választásra hátralévő idő lejárt.')
            targetChannel.send(responseEmbed);
            main.delete();
            isStop = true;
            return;
          }
          if (collectedReaction.first().emoji.name == '❌') {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor('#FFA500')
              .setTitle('Konfiguráció Leállítva.')
            targetChannel.send(responseEmbed);
            main.delete();
            isStop = true;
            return;
          } else if (collectedReaction.first().emoji.name == '1️⃣') {
            UseAutoWeather = true;
          } else {
            UseAutoWeather = false;
          }
          main.delete();
        });
      }

      if (!isStop && UseAutoWeather == true) {
        //autoWeatherCityQuestion
        let lowerSettlementCollection = [];
        await settlementCollection.forEach((item, i) => {
          lowerSettlementCollection.push(item.toLowerCase());
        });

        filter = m => (lowerSettlementCollection.includes(m.content.toLowerCase().trim()) || m.content.toLowerCase().trim() == "mégse") && m.author.id == message.author.id;
        await targetChannel.send(autoWeatherCityQuestion).then(async (main) => {
          let collectedMessages;
          try {
            collectedMessages = await targetChannel.awaitMessages(filter, {
              time: 120000,
              max: 1,
              errors: ['time']
            });
          } catch (e) {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle('Választásra hátralévő idő lejárt.')
            targetChannel.send(responseEmbed);
            main.delete();
            isStop = true;
            return;
          }
          if (collectedMessages.first().content.trim().toLowerCase() == "mégse") {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor('#FFA500')
              .setTitle('Konfiguráció Leállítva.')
            targetChannel.send(responseEmbed);
            main.delete();
            isStop = true;
            return;
          }
          AutoWeatherCity = collectedMessages.first().content.toLowerCase().trim();
          main.delete();
          collectedMessages.first().delete();
        });
      }

      if (!isStop && UseAutoWeather == true) {
        //autoWeatherChannelQuestion
        filter = m => (m.mentions.channels.first() || m.content.toLowerCase().trim() == "mégse") && m.author.id == message.author.id;
        await targetChannel.send(autoWeatherChannelQuestion).then(async (main) => {
          let collectedMessages;
          try {
            collectedMessages = await targetChannel.awaitMessages(filter, {
              time: 60000,
              max: 1,
              errors: ['time']
            });
          } catch (e) {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle('Választásra hátralévő idő lejárt.')
            targetChannel.send(responseEmbed);
            main.delete();
            isStop = true;
            return;
          }
          if (collectedMessages.first().content.trim().toLowerCase() == "mégse") {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor('#FFA500')
              .setTitle('Konfiguráció Leállítva.')
            targetChannel.send(responseEmbed);
            main.delete();
            isStop = true;
            return;
          }
          AutomatedWeatherChannel = collectedMessages.first().mentions.channels.first().id;
          main.delete();
          collectedMessages.first().delete();
        });
      }

      if (!isStop) {
        //clearChannelBoolQuestion
        filter = (m, user) => user.id == message.author.id && (BoolAskEmojiArray.includes(m.emoji.name));
        await targetChannel.send(clearChannelBoolQuestion).then(async (main) => {
          BoolAskEmojiArray.reduce(async (item, i) => {
            if (!main.deleted) {
              await item;
              try {
                await main.react(i);
              } catch (e) {}
            }
          }, undefined);
          let collectedReaction;
          try {
            collectedReaction = await main.awaitReactions(filter, {
              time: 60000,
              max: 1,
              errors: ['time']
            });
          } catch (e) {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle('Választásra hátralévő idő lejárt.')
            targetChannel.send(responseEmbed);
            main.delete();
            isStop = true;
            return;
          }
          if (collectedReaction.first().emoji.name == '❌') {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor('#FFA500')
              .setTitle('Konfiguráció Leállítva.')
            targetChannel.send(responseEmbed);
            main.delete();
            isStop = true;
            return;
          } else if (collectedReaction.first().emoji.name == '1️⃣') {
            ClearChannel = true;
          } else {
            ClearChannel = false;
          }
          main.delete();
        });
      }

      if (!isStop && ClearChannel == true) {
        //clearChannelQuestion
        filter = m => (m.mentions.channels.first() || m.content.toLowerCase().trim() == "mégse") && m.author.id == message.author.id;
        await targetChannel.send(clearChannelQuestion).then(async (main) => {
          let collectedMessages;
          try {
            collectedMessages = await targetChannel.awaitMessages(filter, {
              time: 60000,
              max: 1,
              errors: ['time']
            });
          } catch (e) {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle('Választásra hátralévő idő lejárt.')
            targetChannel.send(responseEmbed);
            main.delete();
            isStop = true;
            return;
          }
          if (collectedMessages.first().content.trim().toLowerCase() == "mégse") {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor('#FFA500')
              .setTitle('Konfiguráció Leállítva.')
            targetChannel.send(responseEmbed);
            main.delete();
            isStop = true;
            return;
          }
          ClearChannelChannel = collectedMessages.first().mentions.channels.first().id;
          main.delete();
          collectedMessages.first().delete();
        });
      }

      if (!isStop) {
        //UseOneChannelNewsBoolQuestion
        filter = (m, user) => user.id == message.author.id && (BoolAskEmojiArray.includes(m.emoji.name));
        await targetChannel.send(UseOneChannelNewsBoolQuestion).then(async (main) => {
          BoolAskEmojiArray.reduce(async (item, i) => {
            if (!main.deleted) {
              await item;
              try {
                await main.react(i);
              } catch (e) {}
            }
          }, undefined);
          let collectedReaction;
          try {
            collectedReaction = await main.awaitReactions(filter, {
              time: 60000,
              max: 1,
              errors: ['time']
            });
          } catch (e) {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle('Választásra hátralévő idő lejárt.')
            targetChannel.send(responseEmbed);
            main.delete();
            isStop = true;
            return;
          }
          if (collectedReaction.first().emoji.name == '❌') {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor('#FFA500')
              .setTitle('Konfiguráció Leállítva.')
            targetChannel.send(responseEmbed);
            main.delete();
            isStop = true;
            return;
          } else if (collectedReaction.first().emoji.name == '1️⃣') {
            UseOneChannelNews = true;
          } else {
            UseOneChannelNews = false;
          }
          main.delete();
        });
      }

      if (!isStop && UseOneChannelNews == true) {
        //UseOneChannelNewsChannelQuestion
        filter = m => (m.mentions.channels.first() || m.content.toLowerCase().trim() == "mégse") && m.author.id == message.author.id;
        await targetChannel.send(UseOneChannelNewsChannelQuestion).then(async (main) => {
          let collectedMessages;
          try {
            collectedMessages = await targetChannel.awaitMessages(filter, {
              time: 60000,
              max: 1,
              errors: ['time']
            });
          } catch (e) {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle('Választásra hátralévő idő lejárt.')
            targetChannel.send(responseEmbed);
            main.delete();
            isStop = true;
            return;
          }
          if (collectedMessages.first().content.trim().toLowerCase() == "mégse") {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor('#FFA500')
              .setTitle('Konfiguráció Leállítva.')
            targetChannel.send(responseEmbed);
            main.delete();
            isStop = true;
            return;
          }
          OneNewsChannel = collectedMessages.first().mentions.channels.first().id;
          main.delete();
          collectedMessages.first().delete();
        });
      }

      if (!isStop) {
        //UseOneChannelWeatherBoolQuestion
        filter = (m, user) => user.id == message.author.id && (BoolAskEmojiArray.includes(m.emoji.name));
        await targetChannel.send(UseOneChannelWeatherBoolQuestion).then(async (main) => {
          BoolAskEmojiArray.reduce(async (item, i) => {
            if (!main.deleted) {
              await item;
              try {
                await main.react(i);
              } catch (e) {}
            }
          }, undefined);
          let collectedReaction;
          try {
            collectedReaction = await main.awaitReactions(filter, {
              time: 60000,
              max: 1,
              errors: ['time']
            });
          } catch (e) {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle('Választásra hátralévő idő lejárt.')
            targetChannel.send(responseEmbed);
            main.delete();
            isStop = true;
            return;
          }
          if (collectedReaction.first().emoji.name == '❌') {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor('#FFA500')
              .setTitle('Konfiguráció Leállítva.')
            targetChannel.send(responseEmbed);
            main.delete();
            isStop = true;
            return;
          } else if (collectedReaction.first().emoji.name == '1️⃣') {
            UseOneChannelWeather = true;
          } else {
            UseOneChannelWeather = false;
          }
          main.delete();
        });
      }

      if (!isStop && UseOneChannelWeather == true) {
        //UseOneChannelWeatherChannelQuestion
        filter = m => (m.mentions.channels.first() || m.content.toLowerCase().trim() == "mégse") && m.author.id == message.author.id;
        await targetChannel.send(UseOneChannelWeatherChannelQuestion).then(async (main) => {
          let collectedMessages;
          try {
            collectedMessages = await targetChannel.awaitMessages(filter, {
              time: 60000,
              max: 1,
              errors: ['time']
            });
          } catch (e) {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle('Választásra hátralévő idő lejárt.')
            targetChannel.send(responseEmbed);
            main.delete();
            isStop = true;
            return;
          }
          if (collectedMessages.first().content.trim().toLowerCase() == "mégse") {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor('#FFA500')
              .setTitle('Konfiguráció Leállítva.')
            targetChannel.send(responseEmbed);
            main.delete();
            isStop = true;
            return;
          }
          OneWeatherChannel = collectedMessages.first().mentions.channels.first().id;
          main.delete();
          collectedMessages.first().delete();
        });
      }

      if (!isStop) {
        let newData = [{
          "DATA": [{
            "prefix": `${prefix}`,
            "guild": `${message.guild.id}`,
            "AutoWeatherCity": `${AutoWeatherCity}`,

            "Booleans": {
              "ClearChannel": `${ClearChannel}`,
              "UseOneChannelNews": `${UseOneChannelNews}`,
              "UseOneChannelWeather": `${UseOneChannelWeather}`,
              "UseAutoWeather": `${UseAutoWeather}`,
              "IgnoreBots": `${IgnoreBots}`,
              "UseCommandPredict": `${UseCommandPredict}`
            },

            "Channels": {
              "ClearChannelChannel": `${ClearChannelChannel}`,
              "OneNewsChannel": `${OneNewsChannel}`,
              "OneWeatherChannel": `${OneWeatherChannel}`,
              "AutomatedWeatherChannel": `${AutomatedWeatherChannel}`
            },

            "Roles": {
              "Bot": `${BotRole}`
            }
          }],
          "NEWS": [{
            "game": [],
            "gameIndex": 0,
            "tech": [],
            "techIndex": 0,
            "film": [],
            "filmIndex": 0
          }]
        }]
        try {
          write(newData, message.guild.id);

          let responseEmbed = new Discord.MessageEmbed()
            .setColor('#00FF00')
            .setTitle('Sikeres konfiguráció!')
            .setDescription(`A parancslistát a ${prefix}help parancssal tudod lekérni.`)
          await targetChannel.send(responseEmbed);
          return;
        } catch (e) {
          let responseEmbed = new Discord.MessageEmbed()
            .setColor('#FF0000')
            .setTitle('Ismeretlen hiba!')
            .setDescription(`${e}`)
          await targetChannel.send(responseEmbed);
          return;
        }
      }
    } else {
      const guildConfig = client.guildConfigs.get(guild.id);
      const configMap = new Map(Object.entries(guildConfig[0]))
      const configKeys = Object.keys(guildConfig[0])

      configKeys.map(x => {
        if (x == "DATA") {
          configMap.get(x).map(y => {
            prefix = y.prefix;
            AutoWeatherCity = y.AutoWeatherCity;

            ClearChannel = y.Booleans.ClearChannel;
            UseOneChannelNews = y.Booleans.UseOneChannelNews;
            UseOneChannelWeather = y.Booleans.UseOneChannelWeather;
            UseAutoWeather = y.Booleans.UseAutoWeather;
            IgnoreBots = y.Booleans.IgnoreBots;
            UseCommandPredict = y.Booleans.UseCommandPredict;

            ClearChannelChannel = y.Channels.ClearChannelChannel;
            OneNewsChannel = y.Channels.OneNewsChannel;
            OneWeatherChannel = y.Channels.OneWeatherChannel;
            AutomatedWeatherChannel = y.Channels.AutomatedWeatherChannel;

            BotRole = y.Roles.Bot;
          });
        }
      });

      //Edit Questions
      prefixQuestion.setTitle("Kérlek válassz Prefixet");
      predictBoolQuestion.setTitle("Szeretnéd, hogy jelezzem, ha egy olyan parancsot küldenek, ami nem létezik?");
      botBoolQuestion.setTitle("A szerveren használsz más botot?");
      autoWeatherBoolQuestion.setTitle("Kérsz autómatikusan időjárás jelentéseket?");
      clearChannelBoolQuestion.setTitle("Szeretnéd, hogy minden nap [1:00]-kor (EST) töröljek egy kiválasztott csatorna tartalmát?");
      UseOneChannelNewsBoolQuestion.setTitle("Szeretnéd, hogy a parancssal lekért híreket csak egy csatornából lehessen lekérni?");
      UseOneChannelWeatherBoolQuestion.setTitle("Szeretnéd, hogy a parancssal lekért időjárás jelentéseket csak egy csatornából lehessen lekérni?")

      let botRole;
      let weatherChannelAuto;
      let clearchannelTarget;
      let NewsChannelTarget;
      let WeatherChannelTarget;
      try {
        botRole = await guild.roles.cache.get(BotRole);
      } catch (e) {
        botRole = "-";
      }
      if (!botRole) {
        botRole = "-"
      }
      try {
        weatherChannelAuto = await guild.channels.cache.get(AutomatedWeatherChannel);
      } catch (e) {
        weatherChannelAuto = "-";
      }
      if (!weatherChannelAuto) {
        weatherChannelAuto = "-"
      }
      try {
        clearchannelTarget = await guild.channels.cache.get(ClearChannelChannel);
      } catch (e) {
        clearchannelTarget = "-";
      }
      if (!clearchannelTarget) {
        clearchannelTarget = "-"
      }
      try {
        NewsChannelTarget = await guild.channels.cache.get(OneNewsChannel);
      } catch (e) {
        NewsChannelTarget = "-";
      }
      if (!NewsChannelTarget) {
        NewsChannelTarget = "-"
      }
      try {
        WeatherChannelTarget = await guild.channels.cache.get(OneWeatherChannel);
      } catch (e) {
        WeatherChannelTarget = "-";
      }
      if (!WeatherChannelTarget) {
        WeatherChannelTarget = "-"
      }

      prefixQuestion.setDescription(`Prefix-el lehet parancsokat megadni.\nJelenlegi: ${prefix}\n\nLehetséges válaszok: [ ! @ # $ % ^ & * ( ) _ + - = { } ; : | . < > ? ~ ]\nVálasz üzenetben csak a szimbólumot írd le.`)
      if (UseCommandPredict == "true") {
        predictBoolQuestion.setDescription(`Jelenlegi: Igen\n\n1️⃣ - Igen\n2️⃣ - Nem\n\nVálaszolni az emojikkal tudsz.`)
      } else {
        predictBoolQuestion.setDescription(`Jelenlegi: Nem\n\n1️⃣ - Igen\n2️⃣ - Nem\n\nVálaszolni az emojikkal tudsz.`)
      }
      if (IgnoreBots == "true") {
        botBoolQuestion.setDescription(`Jelenlegi: Igen és van külön bot rankjuk\n\n1️⃣ - Igen és van külön bot rankjuk\n2️⃣ - Nem\n\nVálaszolni az emojikkal tudsz.`)
      } else {
        botBoolQuestion.setDescription(`Jelenlegi: Nem\n\n1️⃣ - Igen és van külön bot rankjuk\n2️⃣ - Nem\n\nVálaszolni az emojikkal tudsz.`)
      }
      botRankQuestion.setDescription(`Jelenlegi: ${botRole}\n\nVálasz üzenetben csak a rankot jelöld meg @ használatával`)
      if (UseAutoWeather == "true") {
        autoWeatherBoolQuestion.setDescription(`Jelenlegi: Igen\n\nNaponta 3-szor [6:00, 12:00, 18:00] (EST) küldök a következő kérdésben megadott városról időjárás jelentést.\n1️⃣ - Igen\n2️⃣ - Nem\n\nVálaszolni az emojikkal tudsz.`)
      } else {
        autoWeatherBoolQuestion.setDescription(`Jelenlegi: Nem\n\nNaponta 3-szor [6:00, 12:00, 18:00] (EST) küldök a következő kérdésben megadott városról időjárás jelentést.\n1️⃣ - Igen\n2️⃣ - Nem\n\nVálaszolni az emojikkal tudsz.`)
      }
      autoWeatherCityQuestion.setDescription(`Jelenlegi: ${AutoWeatherCity}\n\nCsak akkor megyek tovább ha a város név érvényes.\nVálasz üzenetben csak a város nevét írd le.`)
      autoWeatherChannelQuestion.setDescription(`Jelenlegi: ${weatherChannelAuto}\n\nVálasz üzenetben csak a csatornát jelöld meg # használatával.`)
      if (ClearChannel == "true") {
        clearChannelBoolQuestion.setDescription(`Jelenlegi: Igen\n\n1️⃣ - Igen\n2️⃣ - Nem\n\nVálaszolni az emojikkal tudsz.`)
      } else {
        clearChannelBoolQuestion.setDescription(`Jelenlegi: Nem\n\n1️⃣ - Igen\n2️⃣ - Nem\n\nVálaszolni az emojikkal tudsz.`)
      }
      clearChannelQuestion.setDescription(`Jelenlegi: ${clearchannelTarget}\n\nVálasz üzenetben csak a csatornát jelöld meg # használatával.`)
      if (UseOneChannelNews == "true") {
        UseOneChannelNewsBoolQuestion.setDescription(`Jelenlegi: Igen\n\n1️⃣ - Igen\n2️⃣ - Nem\n\nVálaszolni az emojikkal tudsz.`)
      } else {
        UseOneChannelNewsBoolQuestion.setDescription(`Jelenlegi: Nem\n\n1️⃣ - Igen\n2️⃣ - Nem\n\nVálaszolni az emojikkal tudsz.`)
      }
      UseOneChannelNewsChannelQuestion.setDescription(`Jelenlegi: ${NewsChannelTarget}\n\nVálasz üzenetben csak a csatornát jelöld meg # használatával.`)
      if (UseOneChannelWeather == "true") {
        UseOneChannelWeatherBoolQuestion.setDescription(`Jelenlegi: Igen\n\n1️⃣ - Igen\n2️⃣ - Nem\n\nVálaszolni az emojikkal tudsz.`)
      } else {
        UseOneChannelWeatherBoolQuestion.setDescription(`Jelenlegi: Nem\n\n1️⃣ - Igen\n2️⃣ - Nem\n\nVálaszolni az emojikkal tudsz.`)
      }
      UseOneChannelWeatherChannelQuestion.setDescription(`Jelenlegi: ${WeatherChannelTarget}\n\nVálasz üzenetben csak a csatornát jelöld meg # használatával.`)


      const mainQuestionEmojiArray = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "❌"];

      const mainQuestionEmbed = new Discord.MessageEmbed()
        .setColor('#0000FF')
        .setTitle('Melyik beállítást szeretnéd megváltoztatni?')
        .setDescription(`1️⃣ - Prefix\n2️⃣ - Nem Létező Parancs Jelzés\n3️⃣ - Bot Kompatibilitás\n4️⃣ - Autómatikus Időjárás Jelentés\n5️⃣ - Autómatikus Csatorna Tartalom Törlés\n6️⃣ - Hír Lekérés Korlátozás\n7️⃣ - Időjárás Lekérés Korlátozás\n\nVálaszolni az emojikkal tudsz.`)
        .setFooter("Választásra 2 perc van. --- A konfiguráció leállításához kattints: '❌'-re")

      let mainFilter = (m, user) => user.id == message.author.id && (mainQuestionEmojiArray.includes(m.emoji.name));
      await targetChannel.send(mainQuestionEmbed).then(async (main) => {
        // This is disgusting, but at least works
        mainQuestionEmojiArray.reduce(async (item, i) => {
          if (!main.deleted) {
            await item;
            try {
              await main.react(i);
            } catch (e) {}
          }
        }, undefined);
        let collectedReaction;
        try {
          collectedReaction = await main.awaitReactions(mainFilter, {
            time: 120000,
            max: 1,
            errors: ['time']
          });
        } catch (e) {
          let responseEmbed = new Discord.MessageEmbed()
            .setColor('#FF0000')
            .setTitle('Választásra hátralévő idő lejárt.')
          targetChannel.send(responseEmbed);
          main.delete();
          isStop = true;
          return;
        }
        if (collectedReaction.first().emoji.name == '❌') {
          let responseEmbed = new Discord.MessageEmbed()
            .setColor('#FFA500')
            .setTitle('Konfiguráció Leállítva.')
          targetChannel.send(responseEmbed);
          main.delete();
          isStop = true;
          return;
        }
        main.delete();
        switch (collectedReaction.first().emoji.name) {
          case '1️⃣':
            if (!isStop) {
              //Prefix
              const validPrefixes = [`[`, `!`, `@`, `#`, `$`, `%`, `^`, `&`, `*`, `(`, `)`, `_`, `+`, `-`, `=`, `[`, `]`, `{`, `}`, `;`, `:`, `|`, `.`, `<`, `>`, `?`, `~`, `]`]
              let filter = m => (validPrefixes.includes(m.content.trim()) || m.content.toLowerCase().trim() == "mégse") && m.author.id == message.author.id;
              await targetChannel.send(prefixQuestion).then(async (main) => {
                let collectedMessages;
                try {
                  collectedMessages = await targetChannel.awaitMessages(filter, {
                    time: 60000,
                    max: 1,
                    errors: ['time']
                  });
                } catch (e) {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor('#FF0000')
                    .setTitle('Választásra hátralévő idő lejárt.')
                  targetChannel.send(responseEmbed);
                  main.delete();
                  isStop = true;
                  return;
                }
                if (collectedMessages.first().content.trim().toLowerCase() == "mégse") {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor('#FFA500')
                    .setTitle('Konfiguráció Leállítva.')
                  targetChannel.send(responseEmbed);
                  main.delete();
                  isStop = true;
                  return;
                }
                prefix = collectedMessages.first().content.trim();
                main.delete();
                collectedMessages.first().delete();
              });
            }
            break;
          case '2️⃣':
            //predictBoolQuestion
            if (!isStop) {
              let filter = (m, user) => user.id == message.author.id && (BoolAskEmojiArray.includes(m.emoji.name));
              await targetChannel.send(predictBoolQuestion).then(async (main) => {
                BoolAskEmojiArray.reduce(async (item, i) => {
                  if (!main.deleted) {
                    await item;
                    try {
                      await main.react(i);
                    } catch (e) {}
                  }
                }, undefined);
                let collectedReaction;
                try {
                  collectedReaction = await main.awaitReactions(filter, {
                    time: 60000,
                    max: 1,
                    errors: ['time']
                  });
                } catch (e) {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor('#FF0000')
                    .setTitle('Választásra hátralévő idő lejárt.')
                  targetChannel.send(responseEmbed);
                  main.delete();
                  isStop = true;
                  return;
                }
                if (collectedReaction.first().emoji.name == '❌') {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor('#FFA500')
                    .setTitle('Konfiguráció Leállítva.')
                  targetChannel.send(responseEmbed);
                  main.delete();
                  isStop = true;
                  return;
                } else if (collectedReaction.first().emoji.name == '1️⃣') {
                  UseCommandPredict = true;
                } else {
                  UseCommandPredict = false;
                }
                main.delete();
              });
            }
            break;
          case '3️⃣':
            //BotBool
            if (!isStop) {
              let filter = (m, user) => user.id == message.author.id && (BoolAskEmojiArray.includes(m.emoji.name));
              await targetChannel.send(botBoolQuestion).then(async (main) => {
                BoolAskEmojiArray.reduce(async (item, i) => {
                  if (!main.deleted) {
                    await item;
                    try {
                      await main.react(i);
                    } catch (e) {}
                  }
                }, undefined);
                let collectedReaction;
                try {
                  collectedReaction = await main.awaitReactions(filter, {
                    time: 60000,
                    max: 1,
                    errors: ['time']
                  });
                } catch (e) {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor('#FF0000')
                    .setTitle('Választásra hátralévő idő lejárt.')
                  targetChannel.send(responseEmbed);
                  main.delete();
                  isStop = true;
                  return;
                }
                if (collectedReaction.first().emoji.name == '❌') {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor('#FFA500')
                    .setTitle('Konfiguráció Leállítva.')
                  targetChannel.send(responseEmbed);
                  main.delete();
                  isStop = true;
                  return;
                } else if (collectedReaction.first().emoji.name == '1️⃣') {
                  IgnoreBots = true;
                } else {
                  IgnoreBots = false;
                }
                main.delete();
              });
            }

            if (!isStop && IgnoreBots == true) {
              //botRank
              let filter = m => (m.mentions.roles.first() || m.content.toLowerCase().trim() == "mégse") && m.author.id == message.author.id;
              await targetChannel.send(botRankQuestion).then(async (main) => {
                let collectedMessages;
                try {
                  collectedMessages = await targetChannel.awaitMessages(filter, {
                    time: 60000,
                    max: 1,
                    errors: ['time']
                  });
                } catch (e) {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor('#FF0000')
                    .setTitle('Választásra hátralévő idő lejárt.')
                  targetChannel.send(responseEmbed);
                  main.delete();
                  isStop = true;
                  return;
                }
                if (collectedMessages.first().content.trim().toLowerCase() == "mégse") {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor('#FFA500')
                    .setTitle('Konfiguráció Leállítva.')
                  targetChannel.send(responseEmbed);
                  main.delete();
                  isStop = true;
                  return;
                }
                BotRole = collectedMessages.first().mentions.roles.first().id;
                main.delete();
                collectedMessages.first().delete();
              });
            }
            break;
          case '4️⃣':
            if (!isStop) {
              //autoWeatherBoolQuestion
              let filter = (m, user) => user.id == message.author.id && (BoolAskEmojiArray.includes(m.emoji.name));
              await targetChannel.send(autoWeatherBoolQuestion).then(async (main) => {
                BoolAskEmojiArray.reduce(async (item, i) => {
                  if (!main.deleted) {
                    await item;
                    try {
                      await main.react(i);
                    } catch (e) {}
                  }
                }, undefined);
                let collectedReaction;
                try {
                  collectedReaction = await main.awaitReactions(filter, {
                    time: 60000,
                    max: 1,
                    errors: ['time']
                  });
                } catch (e) {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor('#FF0000')
                    .setTitle('Választásra hátralévő idő lejárt.')
                  targetChannel.send(responseEmbed);
                  main.delete();
                  isStop = true;
                  return;
                }
                if (collectedReaction.first().emoji.name == '❌') {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor('#FFA500')
                    .setTitle('Konfiguráció Leállítva.')
                  targetChannel.send(responseEmbed);
                  main.delete();
                  isStop = true;
                  return;
                } else if (collectedReaction.first().emoji.name == '1️⃣') {
                  UseAutoWeather = true;
                } else {
                  UseAutoWeather = false;
                }
                main.delete();
              });
            }

            if (!isStop && UseAutoWeather == true) {
              //autoWeatherCityQuestion
              let lowerSettlementCollection = [];
              await settlementCollection.forEach((item, i) => {
                lowerSettlementCollection.push(item.toLowerCase());
              });

              let filter = m => (lowerSettlementCollection.includes(m.content.toLowerCase().trim()) || m.content.toLowerCase().trim() == "mégse") && m.author.id == message.author.id;
              await targetChannel.send(autoWeatherCityQuestion).then(async (main) => {
                let collectedMessages;
                try {
                  collectedMessages = await targetChannel.awaitMessages(filter, {
                    time: 120000,
                    max: 1,
                    errors: ['time']
                  });
                } catch (e) {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor('#FF0000')
                    .setTitle('Választásra hátralévő idő lejárt.')
                  targetChannel.send(responseEmbed);
                  main.delete();
                  isStop = true;
                  return;
                }
                if (collectedMessages.first().content.trim().toLowerCase() == "mégse") {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor('#FFA500')
                    .setTitle('Konfiguráció Leállítva.')
                  targetChannel.send(responseEmbed);
                  main.delete();
                  isStop = true;
                  return;
                }
                AutoWeatherCity = collectedMessages.first().content.toLowerCase().trim();
                main.delete();
                collectedMessages.first().delete();
              });
            }

            if (!isStop && UseAutoWeather == true) {
              //autoWeatherChannelQuestion
              let filter = m => (m.mentions.channels.first() || m.content.toLowerCase().trim() == "mégse") && m.author.id == message.author.id;
              await targetChannel.send(autoWeatherChannelQuestion).then(async (main) => {
                let collectedMessages;
                try {
                  collectedMessages = await targetChannel.awaitMessages(filter, {
                    time: 60000,
                    max: 1,
                    errors: ['time']
                  });
                } catch (e) {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor('#FF0000')
                    .setTitle('Választásra hátralévő idő lejárt.')
                  targetChannel.send(responseEmbed);
                  main.delete();
                  isStop = true;
                  return;
                }
                if (collectedMessages.first().content.trim().toLowerCase() == "mégse") {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor('#FFA500')
                    .setTitle('Konfiguráció Leállítva.')
                  targetChannel.send(responseEmbed);
                  main.delete();
                  isStop = true;
                  return;
                }
                AutomatedWeatherChannel = collectedMessages.first().mentions.channels.first().id;
                main.delete();
                collectedMessages.first().delete();
              });
            }
            break;
          case '5️⃣':
            if (!isStop) {
              //clearChannelBoolQuestion
              let filter = (m, user) => user.id == message.author.id && (BoolAskEmojiArray.includes(m.emoji.name));
              await targetChannel.send(clearChannelBoolQuestion).then(async (main) => {
                BoolAskEmojiArray.reduce(async (item, i) => {
                  if (!main.deleted) {
                    await item;
                    try {
                      await main.react(i);
                    } catch (e) {}
                  }
                }, undefined);
                let collectedReaction;
                try {
                  collectedReaction = await main.awaitReactions(filter, {
                    time: 60000,
                    max: 1,
                    errors: ['time']
                  });
                } catch (e) {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor('#FF0000')
                    .setTitle('Választásra hátralévő idő lejárt.')
                  targetChannel.send(responseEmbed);
                  main.delete();
                  isStop = true;
                  return;
                }
                if (collectedReaction.first().emoji.name == '❌') {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor('#FFA500')
                    .setTitle('Konfiguráció Leállítva.')
                  targetChannel.send(responseEmbed);
                  main.delete();
                  isStop = true;
                  return;
                } else if (collectedReaction.first().emoji.name == '1️⃣') {
                  ClearChannel = true;
                } else {
                  ClearChannel = false;
                }
                main.delete();
              });
            }

            if (!isStop && ClearChannel == true) {
              //clearChannelQuestion
              let filter = m => (m.mentions.channels.first() || m.content.toLowerCase().trim() == "mégse") && m.author.id == message.author.id;
              await targetChannel.send(clearChannelQuestion).then(async (main) => {
                let collectedMessages;
                try {
                  collectedMessages = await targetChannel.awaitMessages(filter, {
                    time: 60000,
                    max: 1,
                    errors: ['time']
                  });
                } catch (e) {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor('#FF0000')
                    .setTitle('Választásra hátralévő idő lejárt.')
                  targetChannel.send(responseEmbed);
                  main.delete();
                  isStop = true;
                  return;
                }
                if (collectedMessages.first().content.trim().toLowerCase() == "mégse") {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor('#FFA500')
                    .setTitle('Konfiguráció Leállítva.')
                  targetChannel.send(responseEmbed);
                  main.delete();
                  isStop = true;
                  return;
                }
                ClearChannelChannel = collectedMessages.first().mentions.channels.first().id;
                main.delete();
                collectedMessages.first().delete();
              });
            }
            break;
          case '6️⃣':
            if (!isStop) {
              //UseOneChannelNewsBoolQuestion
              let filter = (m, user) => user.id == message.author.id && (BoolAskEmojiArray.includes(m.emoji.name));
              await targetChannel.send(UseOneChannelNewsBoolQuestion).then(async (main) => {
                BoolAskEmojiArray.reduce(async (item, i) => {
                  if (!main.deleted) {
                    await item;
                    try {
                      await main.react(i);
                    } catch (e) {}
                  }
                }, undefined);
                let collectedReaction;
                try {
                  collectedReaction = await main.awaitReactions(filter, {
                    time: 60000,
                    max: 1,
                    errors: ['time']
                  });
                } catch (e) {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor('#FF0000')
                    .setTitle('Választásra hátralévő idő lejárt.')
                  targetChannel.send(responseEmbed);
                  main.delete();
                  isStop = true;
                  return;
                }
                if (collectedReaction.first().emoji.name == '❌') {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor('#FFA500')
                    .setTitle('Konfiguráció Leállítva.')
                  targetChannel.send(responseEmbed);
                  main.delete();
                  isStop = true;
                  return;
                } else if (collectedReaction.first().emoji.name == '1️⃣') {
                  UseOneChannelNews = true;
                } else {
                  UseOneChannelNews = false;
                }
                main.delete();
              });
            }

            if (!isStop && UseOneChannelNews == true) {
              //UseOneChannelNewsChannelQuestion
              let filter = m => (m.mentions.channels.first() || m.content.toLowerCase().trim() == "mégse") && m.author.id == message.author.id;
              await targetChannel.send(UseOneChannelNewsChannelQuestion).then(async (main) => {
                let collectedMessages;
                try {
                  collectedMessages = await targetChannel.awaitMessages(filter, {
                    time: 60000,
                    max: 1,
                    errors: ['time']
                  });
                } catch (e) {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor('#FF0000')
                    .setTitle('Választásra hátralévő idő lejárt.')
                  targetChannel.send(responseEmbed);
                  main.delete();
                  isStop = true;
                  return;
                }
                if (collectedMessages.first().content.trim().toLowerCase() == "mégse") {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor('#FFA500')
                    .setTitle('Konfiguráció Leállítva.')
                  targetChannel.send(responseEmbed);
                  main.delete();
                  isStop = true;
                  return;
                }
                OneNewsChannel = collectedMessages.first().mentions.channels.first().id;
                main.delete();
                collectedMessages.first().delete();
              });
            }

            break;
          case '7️⃣':
            if (!isStop) {
              //UseOneChannelWeatherBoolQuestion
              let filter = (m, user) => user.id == message.author.id && (BoolAskEmojiArray.includes(m.emoji.name));
              await targetChannel.send(UseOneChannelWeatherBoolQuestion).then(async (main) => {
                BoolAskEmojiArray.reduce(async (item, i) => {
                  if (!main.deleted) {
                    await item;
                    try {
                      await main.react(i);
                    } catch (e) {}
                  }
                }, undefined);
                let collectedReaction;
                try {
                  collectedReaction = await main.awaitReactions(filter, {
                    time: 60000,
                    max: 1,
                    errors: ['time']
                  });
                } catch (e) {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor('#FF0000')
                    .setTitle('Választásra hátralévő idő lejárt.')
                  targetChannel.send(responseEmbed);
                  main.delete();
                  isStop = true;
                  return;
                }
                if (collectedReaction.first().emoji.name == '❌') {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor('#FFA500')
                    .setTitle('Konfiguráció Leállítva.')
                  targetChannel.send(responseEmbed);
                  main.delete();
                  isStop = true;
                  return;
                } else if (collectedReaction.first().emoji.name == '1️⃣') {
                  UseOneChannelWeather = true;
                } else {
                  UseOneChannelWeather = false;
                }
                main.delete();
              });
            }

            if (!isStop && UseOneChannelWeather == true) {
              //UseOneChannelWeatherChannelQuestion
              let filter = m => (m.mentions.channels.first() || m.content.toLowerCase().trim() == "mégse") && m.author.id == message.author.id;
              await targetChannel.send(UseOneChannelWeatherChannelQuestion).then(async (main) => {
                let collectedMessages;
                try {
                  collectedMessages = await targetChannel.awaitMessages(filter, {
                    time: 60000,
                    max: 1,
                    errors: ['time']
                  });
                } catch (e) {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor('#FF0000')
                    .setTitle('Választásra hátralévő idő lejárt.')
                  targetChannel.send(responseEmbed);
                  main.delete();
                  isStop = true;
                  return;
                }
                if (collectedMessages.first().content.trim().toLowerCase() == "mégse") {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor('#FFA500')
                    .setTitle('Konfiguráció Leállítva.')
                  targetChannel.send(responseEmbed);
                  main.delete();
                  isStop = true;
                  return;
                }
                OneWeatherChannel = collectedMessages.first().mentions.channels.first().id;
                main.delete();
                collectedMessages.first().delete();
              });
            }
            break;
        }

        configKeys.map(x => {
          if (x == "DATA") {
            configMap.get(x).map(y => {
              y.prefix = prefix;
              y.AutoWeatherCity = AutoWeatherCity;

              y.Booleans.ClearChannel = ClearChannel.toString();
              y.Booleans.UseOneChannelNews = UseOneChannelNews.toString();
              y.Booleans.UseOneChannelWeather = UseOneChannelWeather.toString();
              y.Booleans.UseAutoWeather = UseAutoWeather.toString();
              y.Booleans.IgnoreBots = IgnoreBots.toString();
              y.Booleans.UseCommandPredict = UseCommandPredict.toString();

              y.Channels.ClearChannelChannel = ClearChannelChannel;
              y.Channels.OneNewsChannel = OneNewsChannel;
              y.Channels.OneWeatherChannel = OneWeatherChannel;
              y.Channels.AutomatedWeatherChannel = AutomatedWeatherChannel;

              y.Roles.Bot = BotRole;
            });
          }
        });
        if (!isStop) {
          try {
            write(guildConfig, message.guild.id);
            let responseEmbed = new Discord.MessageEmbed()
              .setColor('#00FF00')
              .setTitle('Változtatások elmentve.')
            await targetChannel.send(responseEmbed);
            return;
          } catch (e) {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle('Ismeretlen hiba!')
              .setDescription(`${e}`)
            await targetChannel.send(responseEmbed);
            return;
          }
        }
      });
    }
  },

  help: {
    name: ("config"),
    description: ("Szerver konfiguráció létrehozása vagy szerkesztése."),
    example: ("[prefix]config"),
    tag: ("Admin")
  }
}
