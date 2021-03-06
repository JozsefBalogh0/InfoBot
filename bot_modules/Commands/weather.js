const Discord = require('discord.js');
const path = require('path');
const fs = require('fs');
const settlementCollection = require('../../Data/settlements.json');


function removeDuplicates(data) {
  return data.filter((value, index) => data.indexOf(value) === index);
}

function read(path) {
  try {
    const fileContent = fs.readFileSync(path);
    const array = JSON.parse(fileContent);
    return array;
  } catch {
    const array = [];
    return array;
  }
}

function write(array, path) {
  fs.writeFileSync(path, JSON.stringify(array, null, 2));
}

function removeItemAll(arr, value) {
  var i = 0;
  while (i < arr.length) {
    if (arr[i] === value) {
      arr.splice(i, 1);
    } else {
      ++i;
    }
  }
  return arr;
}


module.exports = {
  run: async (client, message, allCommands, version) => {
    const errFunc = await client.basicFunctions.get("sendErrorReport");

    const guild = await client.guilds.cache.get(message.guild.id);

    const guildConfig = client.guildConfigs.get(guild.id);
    const configMap = new Map(Object.entries(guildConfig[0]))
    const configKeys = Object.keys(guildConfig[0])

    let prefix;
    let UseOneChannelWeather;
    let OneWeatherChannel;

    configKeys.map(x => {
      if (x == "DATA") {
        configMap.get(x).map(y => {
          prefix = y.prefix;

          UseOneChannelWeather = y.Booleans.UseOneChannelWeather;

          OneWeatherChannel = y.Channels.OneWeatherChannel;
        });
      }
    });

    const targetChannel = await guild.channels.cache.get(message.channel.id);

    const author = message.guild.member(message.author)
    const authorData = await client.users.fetch(author.id);

    await message.delete();

    let weatherChannel;

    if (UseOneChannelWeather == "true") {
      weatherChannel = await guild.channels.cache.get(OneWeatherChannel);

      if (targetChannel.id != weatherChannel.id) {
        const responseEmbed = new Discord.MessageEmbed()
          .setColor('#FF0000')
          .setTitle(`${authorData.username}, az id??j??r??st csak itt tudod lek??rni:`)
          .setDescription(`${weatherChannel}`)

        await targetChannel.send(responseEmbed);
        return;
      }
    }

    const input = await message.content.toLowerCase().replace(prefix, "").replace("id??j??r??s", "").replace(/[.*+?^${}()|[\]\\]/g, '').trim();
    let settlement;

    const isSettlement = await settlementCollection.find(x => {
      if (x.toLowerCase() == input) {
        settlement = x
      }
    })

    if (!settlement) {
      if (input == "") {
        const responseEmbed = new Discord.MessageEmbed()
          .setColor('#FF0000')
          .setTitle(`${authorData.username}, k??rlek adj meg egy Magyarorsz??gi telep??l??st.`)
          .setFooter(`${prefix}id??j??r??s [Telep??l??s]`)

        await targetChannel.send(responseEmbed);
        return;
      }

      let possibleMatches = [];
      let characterToRemove = -1;
      let isError = false;

      const findSuggestion = async (data, input, amount) => {
        settlementCollection.forEach(async (item, i) => {
          if(!isError) {
            try {
              const found = item.toLowerCase().match(input.slice(0, characterToRemove))
              if (possibleMatches.length >= 3 || characterToRemove >= 8) {
                return;
              }
              if (found != null) {
                possibleMatches.push(found.input)
                return;
              }
              if ((i + 1 == settlementCollection.length) && (possibleMatches.length == 0)) {
                characterToRemove--;
                await findSuggestion(settlementCollection, input, characterToRemove);
              }
            } catch (error) {
              console.log(error)
              errFunc.run(client, targetChannel, ``, `Ismeretlen hiba!`, `Failed to get settlement suggestions\nfrom JSON file.`, error);
              isError = true;
              return;
            }
          }
        })
      }
      await findSuggestion(settlementCollection, input, characterToRemove);

      if (possibleMatches.length == 0) {
        const responseEmbed = new Discord.MessageEmbed()
          .setColor('#FF0000')
          .setTitle(`${authorData.username}, nem ismerek ilyen Magyarorsz??gi telep??l??s: "${input}"`)

        await targetChannel.send(responseEmbed);
        return;
      } else {
        let suggestions = [];
        await possibleMatches.forEach(item => {
          const string = item.charAt(0).toUpperCase() + item.slice(1);
          suggestions.push(`${string}\n`)
        })
        const stringSugg = suggestions.toString().replaceAll(',', '');

        if (suggestions.length == 1) {
          const responseEmbed = new Discord.MessageEmbed()
            .setColor('#FF0000')
            .setTitle(`${authorData.username}, nem ismerek ilyen Magyarorsz??gi telep??l??s: "${input}"`)
            .setDescription(`Tal??n erre gondolt??l?\n\n${stringSugg}`)

          await targetChannel.send(responseEmbed);
          return;
        } else {
          const responseEmbed = new Discord.MessageEmbed()
            .setColor('#FF0000')
            .setTitle(`${authorData.username}, nem ismerek ilyen Magyarorsz??gi telep??l??s: "${input}"`)
            .setDescription(`Tal??n ezek k??z??l gondolt??l valamelyikre?\n\n${stringSugg}`)

          await targetChannel.send(responseEmbed);
          return;
        }
      }
    } else {
      const func = await client.automatedFunctions.get("id??j??r??sAutomatic");
      func.run(client, targetChannel, settlement);
      return;
    }
  },


  help: {
    name: ("id??j??r??s"),
    description: ("Egy telep??l??s id??j??r??s??nak lek??r??se."),
    example: ("[prefix]id??j??r??s [Telep??l??s]"),
    tag: ("B??rki")
  }
}
