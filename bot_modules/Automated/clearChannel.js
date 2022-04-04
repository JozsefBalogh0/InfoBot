const Discord = require('discord.js');
const sleep = require('sleep-promise');


module.exports = {
  run: async (client, channel, settlement) => {
    await client.guildConfigs.map(async (item, i) => {
      const configMap = new Map(Object.entries(item[0]))
      const configKeys = Object.keys(item[0])

      let ClearChannel = false;
      let guildID;
      let channel;

      configKeys.map(x => {
        if (x == "DATA") {
          configMap.get(x).map(y => {
            guildID = y.guild;

            ClearChannel = y.Booleans.ClearChannel;

            channel = y.Channels.ClearChannelChannel
          });
        }
      });

      const guild = await client.guilds.cache.get(guildID);

      if (ClearChannel == "true") {
        const targetChannel = await guild.channels.cache.get(channel);
        let responseEmbed = new Discord.MessageEmbed()
          .setColor("#FF0000")
          .setTitle(`Üzenetek törlése folyamatban...`)
        await targetChannel.send(responseEmbed).then(async () => {
          await sleep(2000);

          let fetched;
          try {
            do {
              fetched = await targetChannel.messages.fetch({
                limit: 100
              });
              targetChannel.bulkDelete(fetched);
            }
            while (fetched.size >= 2);
          } catch(error) {
            console.log(error)
            let responseEmbed = new Discord.MessageEmbed()
              .setColor("#FF0000")
              .setTitle(`Ismeretlen hiba!`)
              .setFooter(error.message)
            await targetChannel.send(responseEmbed);
            return;
          }

          let finishedEmbed = new Discord.MessageEmbed()
            .setColor("#00FF00")
            .setTitle(`Üzenetek sikeresen törölve.`)
          await targetChannel.send(finishedEmbed).then(async (sent) => {
            await sent.delete({
              timeout: 10000
            });
          });
        });

      } else {
        return;
      }
    });
  },


  help: {
    name: ("clearChannel"),
  }
}
