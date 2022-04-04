const Discord = require('discord.js');
const glob = require("glob");


async function getGuilds(path, collection, description) {
  return new Promise(function(resolve, reject) {
    const getDirectories = (src, callback) => {
      glob(src + '/**/*', callback);
    }

    getDirectories(path, (err, res) => {
      if (err) {
        console.log(`Error:\n${err}`);
      } else {
        //Only get files with the extension .json
        let jsonFiles = res.filter(f => f.split('.').pop() == ('json'))
        //If no .json files
        if (jsonFiles.length <= 0) {
          return;
        }

        jsonFiles.forEach((item, i) => {
          //Load
          let props = require(`./../../${item}`)

          //Add to collection
          resolve(collection.set(item.replace(path, "").replace('/', "").split('.')[0], props));
        })
      }
    })
  })
}



module.exports = {
  run: async (client, message, commands, version) => {
    //Don't trigger if message is from bot or DMs
    if (message.guild === null) return;

    //Get collection of guilds
    await getGuilds('Data/Guilds', client.guildConfigs, 'guilds');
    let guildConfig;
    let configMap;
    let configKeys;

    //Get message's guild
    const guild = await client.guilds.cache.get(message.guild.id);

    const mainConf = await client.basicFunctions.get("getFromConfig");

    let prefix = "";

    let IgnoreBots;
    let UseCommandPredict;
    let BotRole;

    if (!client.guildConfigs.get(guild.id)) {
      //IF NO CONFIG
      await mainConf.run("prefix", async (response) => {
        prefix = response;
      });
    } else {
      //IF CONFIG EXISTS
      //GET DATA FROM CONFIG
      guildConfig = client.guildConfigs.get(guild.id);
      configMap = new Map(Object.entries(guildConfig[0]))
      configKeys = Object.keys(guildConfig[0])

      configKeys.map(x => {
        if (x == "DATA") {
          configMap.get(x).map(y => {
            prefix = y.prefix;
            UseCommandPredict = y.Booleans.UseCommandPredict;
            IgnoreBots = y.Booleans.IgnoreBots;
            BotRole = y.Roles.Bot;
          });
        }
      });
    }

    //return if message only contains prefix or does not start with prefix
    const characterArray = Array.from(message.content)

    if ((!message.content.startsWith(prefix)) || (characterArray.length <= 1)) return;
    else {
      let prefixCount = 0;

      characterArray.forEach((item, i) => {
        if ((item == prefix) && !(characterArray[i - 1] == '@')) prefixCount++;
      });

      if (prefixCount >= 2) return;
    }

    const msg = await message.content.toLowerCase().replace(prefix, "");
    const messageArray = await msg.split(" ");
    const command = await messageArray[0].trim();
    const cmd = await commands.get(command);
    const allCommands = commands;
    const targetChannel = await guild.channels.cache.get(message.channel.id);

    if (!client.guildConfigs.get(guild.id)) {
      //IF NO CONFIG
      if (command == "config") {
        if (message.member.hasPermission("ADMINISTRATOR")) {
          await cmd.run(client, message, true);
        } else {
          let responseEmbed = new Discord.MessageEmbed()
            .setColor("#FF0000")
            .setTitle(`${message.author.username}, Szerver konfiguráció nem készűlt el.`)
            .setDescription(`Kérlek szólj egy adminnak, hogy futtassa a '!config' parancsot.`)
          await targetChannel.send(responseEmbed);
          return;
        }
      } else {
        if (message.member.hasPermission("ADMINISTRATOR")) {
          let responseEmbed = new Discord.MessageEmbed()
            .setColor("#FF0000")
            .setTitle(`${message.author.username}, Szerver konfiguráció nem készűlt el.`)
            .setDescription(`Kérlek futtasd a '!config' parancsot.`)
          await targetChannel.send(responseEmbed);
        } else {
          let responseEmbed = new Discord.MessageEmbed()
            .setColor("#FF0000")
            .setTitle(`${message.author.username}, Szerver konfiguráció nem készűlt el.`)
            .setDescription(`Kérlek szólj egy adminnak, hogy futtassa a '!config' parancsot.`)
          await targetChannel.send(responseEmbed);
        }
        return;
      }
    } else {
      //IF CONFIG EXISTS
      const author = await message.guild.member(message.author);

      //Check for bots?
      if (IgnoreBots == "true") {
        if (author._roles.includes(BotRole)) return;
      }
      if (command == "config") {
        if (message.member.hasPermission("ADMINISTRATOR")) {
          await cmd.run(client, message, false);
        } else {
          return;
        }
      } else {
        if (cmd) {
          await cmd.run(client, message, allCommands, version)
        } else {
          if (UseCommandPredict == "true") {
            const errFunc = await client.basicFunctions.get("sendErrorReport");

            let possibleMatches = [];
            let characterToRemove = -1;
            let commandArray = [];
            let isReverseMatch = false;
            let isError = false;

            await allCommands.forEach(async (item) => {
              await Object.entries(item).forEach(x => {
                if (x[1].name != undefined && x[1].name != "run") {
                  commandArray.push(x[1].name)
                }
              });
            });

            const findSuggestion = async (data, input, amount) => {
              data.forEach(async (item, i) => {
                if (!isError) {
                  try {
                    const found = item.toLowerCase().match(input.slice(0, characterToRemove))
                    if (possibleMatches.length >= 1 || characterToRemove >= 8 || input.slice(0, characterToRemove) == '') {
                      return;
                    }
                    if (found != null) {
                      possibleMatches.push(found.input)
                      return;
                    }
                    if ((i + 1 == data.length) && (possibleMatches.length == 0)) {
                      characterToRemove--;
                      await findSuggestion(data, input, characterToRemove);
                    }
                  } catch (error) {
                    console.log(error)
                    errFunc.run(client, targetChannel, ``, `Ismeretlen hiba!`, `Failed to get command suggestions\nfrom internal functions.`, error);
                    isError = true;
                    return;
                  }
                }
              })
            }
            await findSuggestion(commandArray, command, characterToRemove);

            if (possibleMatches.length == 0) {
              const invalidEmbed = new Discord.MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`${message.author.username}, ilyen parancs nem létezik.`)
                .setDescription(`A parancslistához írd be: ${prefix}help`)

              await targetChannel.send(invalidEmbed)
            } else {
              let suggestions = [];
              await possibleMatches.forEach(item => {
                const string = item.charAt(0).toUpperCase() + item.slice(1);
                suggestions.push(`${string}\n`)
              })
              const stringSugg = suggestions.toString().replaceAll(',', '');

              const invalidEmbed = new Discord.MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`${message.author.username}, ilyen parancs nem létezik.`)
                .setDescription(`Talán erre gondoltál?\n${stringSugg}`)
                .setFooter(`\nA parancslistához írd be: ${prefix}help`)

              await targetChannel.send(invalidEmbed)
              return;
            }
          } else {
            return;
          }
        }
      }
    }
  },


  help: {
    name: ("commandsHandler")
  }
}
