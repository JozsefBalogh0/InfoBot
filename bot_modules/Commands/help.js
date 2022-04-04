const Discord = require('discord.js');
const sortArray = require('sort-array');

async function defaultMenu(filtered, helpEmbed, size) {
  filtered[0].map((x, i) => {
    const name = (x.name.charAt(0).toUpperCase() + x.name.slice(1));

    helpEmbed.addField(`─ ${name} ─`, `**|** ${x.description}\n**|** ${x.example}\n**| Ki használhatja?** ${x.tag}`, true)

    if ((i % 2 !== 0) && (i !== size - 1)) {
      helpEmbed.addField("\u200B", "\u200B")
    }
  });
}

//Help Command
module.exports = {
  run: async (client, message, allCommands, version) => {
    const guild = await client.guilds.cache.get(message.guild.id);

    const targetChannel = await guild.channels.cache.get(message.channel.id);
    const author = await message.guild.member(message.author);
    const authorData = await client.users.fetch(author.id);

    let isAuthorAdmin = false;
    if (message.member.hasPermission("ADMINISTRATOR")) {
      isAuthorAdmin = true;
    }

    const guildConfig = client.guildConfigs.get(guild.id);;
    const configMap = new Map(Object.entries(guildConfig[0]));
    const configKeys = Object.keys(guildConfig[0]);

    let prefix;

    configKeys.map(x => {
      if (x == "DATA") {
        configMap.get(x).map(y => {
          prefix = y.prefix;
        });
      }
    });


    const helpEmbed = new Discord.MessageEmbed()
      .setColor('#0000FF')
      .setTitle(`${authorData.username}, az elérhető parancsok a következőek:`)
      .setFooter(`Bot verzió: ${version}\nPrefix: ${prefix}\n\nOldal: 1\nTovábbi oldalak megtekintéséhez kérlek írd be az oldal számát.\nPélda: !help 2, !help 3`)

    await message.delete();

    let chunked = [];
    let tempArr = [];
    let size = 6;
    let i = 0;
    let commandsArray = allCommands.map(item => item.help);
    sortArray(commandsArray, {
      by: 'tag',
      order: 'desc'
    });

    await allCommands.forEach(async (item) => {
      await Object.entries(item).forEach(x => {
        if (x[1].tag != undefined) {
          switch (x[1].tag) {
            case "Bárki":
              tempArr.push(item.help);
              i++;
              if (i >= size) {
                chunked.push(tempArr);
                tempArr = [];
                i = 0;
              }
              break;

            case "Admin":
              if (isAuthorAdmin) {
                tempArr.push(item.help);
                i++;
                if (i >= size) {
                  chunked.push(tempArr);
                  tempArr = [];
                  i = 0;
                }
              }
              break;
          }
        }
      })
    });
    chunked.push(tempArr);

    const filtered = chunked.filter((a) => a.length)

    let matches = message.content.toLowerCase().replace(prefix, "").match(/\d+/g);
    if (matches != null) matches = matches[0];

    if (!((matches == null) || (matches == 1))) {
      if (filtered[matches - 1]) {
        filtered[matches - 1].map((x, i) => {
          const name = (x.name.charAt(0).toUpperCase() + x.name.slice(1));

          helpEmbed.addField(`─ ${name} ─`, `**|** ${x.description}\n**|** ${x.example}\n**| Ki használhatja?** ${x.tag}`, true)
          helpEmbed.setFooter(`Bot verzió: ${version}\nPrefix: ${prefix}\n\nOldal: ${matches}`)

          if ((i % 2 !== 0) && (i !== size - 1)) {
            helpEmbed.addField("\u200B", "\u200B")
          }
        });
      } else {
        helpEmbed.setTitle(`${authorData.username}, nem létezik ${matches}. oldal.`)
        defaultMenu(filtered, helpEmbed, size)
      }
    } else {
      defaultMenu(filtered, helpEmbed, size)
    }
    if (matches == filtered.length) {
      helpEmbed.setFooter(`Bot verzió: ${version}\nPrefix: ${prefix}\n\nUtolsó oldal.`)
    }
    if (filtered.length == 1) {
      helpEmbed.setFooter(`Bot verzió: ${version}\nPrefix: ${prefix}`)
    }

    await targetChannel.send(helpEmbed);
  },


  help: {
    name: ("help"),
    description: ("Parancslista és a botról szóló információk."),
    example: ("[prefix]help"),
    tag: ("Bárki")
  }
}
