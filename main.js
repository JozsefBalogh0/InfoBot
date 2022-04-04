// LOAD CONFIG
const config = require(__dirname + '/Data/config.json')

const configMap = new Map(Object.entries(config[0]))
const configKeys = Object.keys(config[0])

//GLOBAL VARIABLES
let prefix;
let version;
let dotenvPath;
let ownID;
let ready = false;

//Load main config
configKeys.map(x => {
  if (x == "DATA") {
    configMap.get(x).map(y => {
      prefix = y.prefix;
      version = y.version;
      dotenvPath = y.env;
      ownID = y.selfID;
    });
  }
});

//MAIN
require('dotenv').config({
  path: __dirname + dotenvPath
});
const schedule = require('node-schedule');
const Discord = require('discord.js');
const glob = require("glob");
const path = require('path');
const fs = require("fs");


const client = new Discord.Client({
  partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
  intents: ['GUILD_MEMBERS', 'GUILD_PRESENCES', 'DIRECT_MESSAGES']
});
const TOKEN = (process.env.DISCORD_TOKEN);

client.commands = new Discord.Collection()
client.automatedFunctions = new Discord.Collection()
client.basicFunctions = new Discord.Collection()
client.guildConfigs = new Discord.Collection()


//──────────────────────────────────────────────────────────────────────────────
//Functions
const filePath = "/Data/Guilds";
const extension = ".json";
function write(data, fileName) {
  fs.writeFileSync(path.join(__dirname, filePath, `${fileName}${extension}`), JSON.stringify(data, null, 2), function writeJSON(err) {
    if (err) return console.log(err)
  });
}
//Post Weather Report
async function postWeather() {
  if (ready) {
    const func = await client.automatedFunctions.get("időjárásAutomatic");

    func.run(client, "", "", true);
  }
}

//Clear Channel
async function clearChannel() {
  if (ready) {
    const func = await client.automatedFunctions.get("clearChannel");

    func.run(client);
  }
}

async function getGuilds(path, collection, description) {
  return new Promise(function(resolve, reject) {
    const getDirectories = (src, callback) => {
      glob(src + '/**/*', callback);
    }

    getDirectories(path, (err, res) => {
      if (err) {
        console.log(`Error:\n${err}`);
      } else {
        //Only get files with the extension .js
        let jsonFiles = res.filter(f => f.split('.').pop() == ('json'))
        //If no .js files
        if (jsonFiles.length <= 0) {
          return;
        }

        jsonFiles.forEach((item, i) => {
          //Load
          let props = require(`./${item}`)

          //Add to collection
          resolve(collection.set(item.replace(path, "").replace('/', "").split('.')[0], props));
        })
      }
    })
  })
}
//Get Collections
async function getFunctions(path, collection, description) {
  return new Promise(function(resolve, reject) {
    const getDirectories = (src, callback) => {
      glob(src + '/**/*', callback);
    }

    getDirectories(path, (err, res) => {
      if (err) {
        console.log(`Error:\n${err}`);
      } else {
        //Only get files with the extension .js
        let jsFiles = res.filter(f => f.split('.').pop() == ('js'))
        //If no .js files
        if (jsFiles.length <= 0) {
          console.log(`\n\nNo ${description} to load!`);
          return;
        }

        console.log(`\n\n── Loading ${jsFiles.length} ${description}! ──`);
        jsFiles.forEach((item, i) => {
          //Load
          let props = require(`./${item}`)
          console.log(`[${i+1}] ${item} loaded. Name: ${props.help.name}`)

          //Add to collection
          resolve(collection.set(props.help.name, props));
        })
      }
    })
  })
}

//──────────────────────────────────────────────────────────────────────────────
//Startup
client.on('ready', async () => {
  console.log(`${client.user.tag} is connected to the following server(s):`);
  //Set basic data
  let guilds = [];
  await client.guilds.cache.forEach((item, i) => {
    guilds.push(item);
    console.log(`${item.name} - (${item.id})`)
  });

  client.user.setActivity("News", {
    type: "WATCHING",
  });

  //Get collection of commands
  await getFunctions('bot_modules/Commands', client.commands, 'commands');
  //Get collection of automated functions
  await getFunctions('bot_modules/Automated', client.automatedFunctions, 'automated functions');
  //Get collection of basic functions
  await getFunctions('bot_modules/Basic', client.basicFunctions, 'basic functions');
  //Get collection of guilds
  await getGuilds('Data/Guilds', client.guildConfigs, 'guilds');

  ready = true;
});



//Clean up after bot was removed / server was deleted
client.on('guildDelete', async guild => {
  fs.unlink(path.join(__dirname, `/Data/Guilds/`, `${guild.id}.json`), (err) => {
    if (err) {
      console.log(`Failed to delete local json file: ${err}`);
    }
  });
  client.guildConfigs.delete(guild.id);
});



//Clean up after channel was deleted
client.on('channelDelete', async channel => {
  if (!client.guildConfigs.get(channel.guild.id)) {return;}

  const guildConfig = client.guildConfigs.get(channel.guild.id);
  const configMap = new Map(Object.entries(guildConfig[0]))
  const configKeys = Object.keys(guildConfig[0])

  let ClearChannel;
  let UseOneChannelNews;
  let UseOneChannelWeather;
  let UseAutoWeather;

  let ChannelTypes = [];
  let ChannelArray = []
  configKeys.map(x => {
    if (x == "DATA") {
      configMap.get(x).map(y => {
        ClearChannel = y.Booleans.ClearChannel;
        UseOneChannelNews = y.Booleans.UseOneChannelNews;
        UseOneChannelWeather = y.Booleans.UseOneChannelWeather;
        UseAutoWeather = y.Booleans.UseAutoWeather;

        ChannelArray = Object.entries(y.Channels);
        ChannelArray.forEach((item, i) => {
          if (item.includes(channel.id)) {
            ChannelTypes.push(item[0]);
          }
        });
      });
    }
  });

  if (ChannelTypes.length == 0) {return;}
  else {
    await ChannelTypes.forEach((item, i) => {
      switch (item) {
        case "ClearChannelChannel":
          ClearChannel = false;
          break;
        case "OneNewsChannel":
          UseOneChannelNews = false;
          break;
        case "OneWeatherChannel":
          UseOneChannelWeather = false;
          break;
        case "AutomatedWeatherChannel":
          UseAutoWeather = false;
          break;
      }
    });
    await configKeys.map(x => {
      if (x == "DATA") {
        configMap.get(x).map(y => {
          y.Booleans.ClearChannel = ClearChannel.toString();
          y.Booleans.UseOneChannelNews = UseOneChannelNews.toString();
          y.Booleans.UseOneChannelWeather = UseOneChannelWeather.toString();
          y.Booleans.UseAutoWeather = UseAutoWeather.toString();
        });
      }
    });
    write(guildConfig, channel.guild.id);
  }
});



//Call Commands Handler
client.on('message', async message => {
  if (ready) {
    const func = await client.basicFunctions.get("commandsHandler");
    const commands = client.commands;
    func.run(client, message, commands, version);
  }
});


//Automated Weather Report
schedule.scheduleJob('0 0 6,12,18 * * *', () => {
  postWeather()
}); // Trigger every day at 6:00, 12:00, 18:00
//Clear Channel Every Day at 1am
schedule.scheduleJob('0 0 1 * * *', () => {
  clearChannel()
}); // Trigger every day at 1:00
/*
                *    *    *    *    *    *
                ┬    ┬    ┬    ┬    ┬    ┬
                │    │    │    │    │    |
                │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
                │    │    │    │    └───── month (1 - 12)
                │    │    │    └────────── day of month (1 - 31)
                │    │    └─────────────── hour (0 - 23)
                │    └──────────────────── minute (0 - 59)
                └───────────────────────── second (0 - 59, OPTIONAL)
*/
client.login(TOKEN);
