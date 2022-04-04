const http = require('http');
const JSSoup = require('jssoup').default;
const request = require('request');
const textVersion = require("textversionjs");
const {
  EventEmitter
} = require('events');
const Discord = require('discord.js');
const path = require('path');
const fs = require('fs');
const PORT = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.set({
    'content-type': 'text/plain; charset=utf-8'
  });
  res.end('Hello World');
});


function removeDuplicates(data) {
  return data.filter((value, index) => data.indexOf(value) === index);
}

const filePath = "../../Data/Guilds";
const extension = ".json";

function write(data, fileName) {
  fs.writeFileSync(path.join(__dirname, filePath, `${fileName}${extension}`), JSON.stringify(data, null, 2), function writeJSON(err) {
    if (err) return console.log(err)
  });
}

function areArraysEqual(a1, a2) {
  const superSet = {};
  for (const i of a1) {
    const e = i + typeof i;
    superSet[e] = 1;
  }

  for (const i of a2) {
    const e = i + typeof i;
    if (!superSet[e]) {
      return false;
    }
    superSet[e] = 2;
  }

  for (let e in superSet) {
    if (superSet[e] === 1) {
      return false;
    }
  }

  return true;
}


module.exports = {
  run: async (client, message, allCommands, version) => {
    const emitter = new EventEmitter();

    const errFunc = await client.basicFunctions.get("sendErrorReport");

    emitter.on('error', (error) => {
      console.log(error)
      errFunc.run(client, targetChannel, ``, `Olvasás hiba!`, `${error.message}`);
      return;
    });

    const guild = await client.guilds.cache.get(message.guild.id);

    const guildConfig = client.guildConfigs.get(guild.id);
    const configMap = new Map(Object.entries(guildConfig[0]))
    const configKeys = Object.keys(guildConfig[0])

    let prefix;
    let UseOneChannelNews;
    let OneNewsChannel;

    configKeys.map(x => {
      if (x == "DATA") {
        configMap.get(x).map(y => {
          prefix = y.prefix;

          UseOneChannelNews = y.Booleans.UseOneChannelNews;

          OneNewsChannel = y.Channels.OneNewsChannel;
        });
      }
    });

    await message.delete();

    const targetChannel = await guild.channels.cache.get(message.channel.id);
    let newsChannel;

    const arg = await message.content.toLowerCase().replace(prefix, "").replace("hír", "").replace(/[.*+?^${}()|[\]\\]/g, '').trim();

    if (UseOneChannelNews == "true") {
      newsChannel = await guild.channels.cache.get(OneNewsChannel);

      if ((targetChannel.id != newsChannel.id) && (arg == "game" || arg == "tech" || arg == "film")) {
        let responseEmbed = new Discord.MessageEmbed()
          .setColor("#FF0000")
          .setTitle(`${message.author.username}, híreket csak itt tudsz lekérni:`)
          .setDescription(`${newsChannel}`)
        await targetChannel.send(responseEmbed);
        return;
      }
    }

    const author = message.guild.member(message.author)
    const authorData = await client.users.fetch(author.id);

    switch (arg) {
      //--------------------------------------------------------------------------------------------------------------------------------

      case "game":
        request('https://www.gamestar.hu/hirek', async (
          error,
          response,
          body
        ) => {
          if (error) {
            console.log(error)
            errFunc.run(client, targetChannel, ``, `Ismeretlen hiba!`, ``, error);
            return;
          }
          const soup = new JSSoup(body);

          //Web scraping
          const divs = soup.findAll('div', {
            "class": "text"
          }).map(t => t.toString());
          let href = soup.findAll('a').map(t => t.toString());
          let links = [];
          let data = [];
          let textBody;

          await href.forEach((item, i) => {
            //Get href links that contain hir, but not hirek -> [0] latest news
            if (item.includes("hir") && !(item.includes("hirek")) && (item.includes("html"))) {
              links.push(`${(item.split('href="').pop().split('"')[0])}`);
            } else return;
          });

          links = removeDuplicates(links)
          let linkIndex;

          let gameIndex;
          let gameLinks;

          configKeys.map(x => {
            if (x == "NEWS") {
              configMap.get(x).map(y => {
                gameIndex = y.gameIndex;
                gameLinks = y.game;
              });
            }
          });

          if (areArraysEqual(gameLinks, links)) {
            gameIndex = gameIndex + 1;
            linkIndex = gameIndex;

            if (gameIndex >= links.length) {
              gameIndex = 0;
              linkIndex = gameIndex;
            }

            configKeys.map(x => {
              if (x == "NEWS") {
                configMap.get(x).map(y => {
                  y.gameIndex = gameIndex;
                  y.game = gameLinks;
                });
              }
            });
            write(guildConfig, message.guild.id);
          } else {
            gameIndex = 0;
            linkIndex = gameIndex;
            gameLinks = links;

            configKeys.map(x => {
              if (x == "NEWS") {
                configMap.get(x).map(y => {
                  y.gameIndex = gameIndex;
                  y.game = gameLinks;
                });
              }
            });
            write(guildConfig, message.guild.id);
          }

          await href.find(r => {
            if (r.includes(links[linkIndex])) {
              data.push(textVersion(r));
            }
          })
          if (!data[1]) {
            emitter.emit(
              'error',
              new Error(`Nem sikerűlt URL adatait lekérni JSON fájlból.`));
            return;
          }

          const title = data[1].replace(links[linkIndex], "").replace(/[.*+?^${}()|[\]\\]/g, '').replace(/\n/g, '').trim();

          await divs.forEach(item => {
            if (item.includes(links[linkIndex])) {
              textBody = textVersion(item).replace(links[linkIndex], "").replace(/[.*+?^${}()|[\]\\]/g, '').replace(title, "").replaceAll("-", "");
            }
          })

          request(`https://www.gamestar.hu${links[linkIndex]}`, async (
            error,
            response,
            body
          ) => {
            if (error) {
              console.log(error)
              errFunc.run(client, targetChannel, ``, `Ismeretlen hiba!`, ``, error);
              return;
            }
            const soup = new JSSoup(body);

            let images = soup.findAll('img').map(t => t.toString());
            let img;

            await images.forEach(item => {
              if (textVersion(item).replace(/[.*+?^${}()|[\]\\]/g, '').includes(title)) {
                img = item;
              }
            })

            const pictureUrl = textVersion(img).replace(links[linkIndex], "").replace(title, "").replace(/[()|[\]\\]/g, '').replace(/\n/g, '').replace("! kép", "").replace(/^.+https:/, '').trim();

            try {
              const newsEmbed = new Discord.MessageEmbed()
                .setColor('#0099FF')
                .setTitle(title)
                .setThumbnail(`https://www.gamestar.hu/site/images/icons/android-chrome-192x192.png`)
                .setURL(`https://www.gamestar.hu${links[linkIndex]}`)
                .setFooter(textBody)
                .setImage(`https:${pictureUrl}`)

              await targetChannel.send(newsEmbed)
            } catch (error) {
              console.log(error)
              errFunc.run(client, targetChannel, ``, `Ismeretlen hiba!`, ``, error);
              return;
            }
          });
        });
        break;

        //--------------------------------------------------------------------------------------------------------------------------------

      case "tech":
        request({
          uri: 'https://www.pcx.hu/magazin',
          method: 'POST',
          encoding: 'binary'
        }, async (
          error,
          response,
          body
        ) => {
          if (error) {
            console.log(error)
            errFunc.run(client, targetChannel, ``, `Ismeretlen hiba!`, ``, error);
            return;
          }
          const soup = new JSSoup(body);

          //Web scraping
          const divs = soup.findAll('div', {
            "class": "news-desc"
          }).map(t => t.toString());
          let href = soup.findAll('div', {
            class: "news_copy"
          }).map(t => t.toString());
          let links = [];
          let data = [];
          let textBody;

          await href.forEach((item, i) => {
            links.push(`${(item.split(`href='`).pop().split("'")[0])}`);
          });

          let linkIndex;

          let techIndex;
          let techLinks;

          configKeys.map(x => {
            if (x == "NEWS") {
              configMap.get(x).map(y => {
                techIndex = y.techIndex;
                techLinks = y.tech;
              });
            }
          });

          if (areArraysEqual(techLinks, links)) {
            techIndex = techIndex + 1;
            linkIndex = techIndex;

            if (techIndex >= links.length) {
              techIndex = 0;
              linkIndex = techIndex;
            }

            configKeys.map(x => {
              if (x == "NEWS") {
                configMap.get(x).map(y => {
                  y.techIndex = techIndex;
                  y.tech = techLinks;
                });
              }
            });
            write(guildConfig, message.guild.id);
          } else {
            techIndex = 0;
            linkIndex = techIndex;
            techLinks = links;

            configKeys.map(x => {
              if (x == "NEWS") {
                configMap.get(x).map(y => {
                  y.techIndex = techIndex;
                  y.tech = techLinks;
                });
              }
            });
            write(guildConfig, message.guild.id);
          }
          if (!links[linkIndex]) {
            emitter.emit(
              'error',
              new Error(`Nem sikerűlt URL adatait lekérni JSON fájlból.`));
            return;
          }

          let titles = soup.findAll('a', {
            href: `${links[linkIndex]}`
          }).map(t => t.toString());
          let title = (`${(titles[0].split(`title="`).pop().split('"')[0])}`).trim();


          await divs.forEach(item => {
            if (item.includes(title)) {
              textBody = textVersion(item).replace(links[linkIndex], "").replace(/[*+?^${}()|[\]\\]/g, '').replace(title, "").replaceAll("õ", "ő").replaceAll("&#8211;", "-").replaceAll("û", "ű").split('.')[0];
            }
          })

          request(`https://www.pcx.hu${links[linkIndex]}`, async (
            error,
            response,
            body
          ) => {
            if (error) {
              console.log(error)
              errFunc.run(client, targetChannel, ``, `Ismeretlen hiba!`, ``, error);
              return;
            }
            const soup = new JSSoup(body);

            let images = soup.findAll('img').map(t => t.toString());
            let img = [];
            images.forEach(item => {
              if (item.includes("pcx_upload")) {
                img.push(item);
              }
            })

            const pictureUrl = textVersion(img[0]).replace(links[linkIndex], "").replace(title, "").replace(/[()|[\]\\]/g, '').replace(/\n/g, '').replace("!image", "").replace(/^.+https:/, '').replace(/^.+pcx_upload/, '').trim();

            title = title.replaceAll("õ", "ő").replaceAll("&#8211;", "-").replaceAll("û", "ű")

            try {
              const newsEmbed = new Discord.MessageEmbed()
                .setColor('#FF0000')
                .setTitle(title)
                .setThumbnail(`https://www.pcx.hu/images/design/designNew/header_logo_2.png`)
                .setURL(`https://www.pcx.hu${links[linkIndex]}`)
                .setFooter(textBody)
                .setImage(`https://www.pcx.hu/pcx_upload${pictureUrl}`)

              await targetChannel.send(newsEmbed)
            } catch (error) {
              console.log(error)
              errFunc.run(client, targetChannel, ``, `Ismeretlen hiba!`, ``, error);
              return;
            }
          });
        });
        break;

        //--------------------------------------------------------------------------------------------------------------------------------

      case "film":
        request('https://www.filmtekercs.hu/rovat/hirek', async (
          error,
          response,
          body
        ) => {
          if (error) {
            console.log(error)
            errFunc.run(client, targetChannel, ``, `Ismeretlen hiba!`, ``, error);
            return;
          }
          const soup = new JSSoup(body);
          //Web scraping
          const div = soup.findAll('div', {
            class: "herald-posts"
          }).map(t => t.toString());

          const soup2 = new JSSoup(div[0]);
          let href = soup2.findAll('a').map(t => t.toString());
          let divs = soup2.findAll('p').map(t => t.toString());
          let links = [];
          let data = [];

          await href.forEach((item, i) => {
            if (!item.includes("author") && !item.includes("redirect")) {
              links.push(`${(item.split('href="').pop().split('"')[0])}`);
            }
          });

          links = removeDuplicates(links)

          let linkIndex;

          let filmIndex;
          let filmLinks;

          configKeys.map(x => {
            if (x == "NEWS") {
              configMap.get(x).map(y => {
                filmIndex = y.filmIndex;
                filmLinks = y.film;
              });
            }
          });

          if (areArraysEqual(filmLinks, links)) {
            filmIndex = filmIndex + 1;
            linkIndex = filmIndex;

            if (filmIndex >= links.length) {
              filmIndex = 0;
              linkIndex = filmIndex;
            }

            configKeys.map(x => {
              if (x == "NEWS") {
                configMap.get(x).map(y => {
                  y.filmIndex = filmIndex;
                  y.film = filmLinks;
                });
              }
            });
            write(guildConfig, message.guild.id);
          } else {
            filmIndex = 0;
            linkIndex = filmIndex;
            filmLinks = links;

            configKeys.map(x => {
              if (x == "NEWS") {
                configMap.get(x).map(y => {
                  y.filmIndex = filmIndex;
                  y.film = filmLinks;
                });
              }
            });
            write(guildConfig, message.guild.id);
          }

          if (!links[linkIndex]) {
            emitter.emit(
              'error',
              new Error(`Nem sikerűlt URL adatait lekérni JSON fájlból.`));
            return;
          }

          let texts = soup2.findAll('a', {
            href: links[linkIndex]
          }).map(t => t.toString());

          await href.find(r => {
            if (r.includes(links[linkIndex]) && r.includes("title")) {
              data.push(`${(r.split('title="').pop().split('"')[0])}`);
            }
          })

          //EDIT LINKS AND DIVS INDEX TO MATCH DESCRIPTION WITH ENTRY!!!
          const title = data[0].replace(links[linkIndex], "").replace(/[*+–^${}()|[\]\\]/g, '').replace(/\n/g, '').trim();
          const textBody = textVersion(divs[linkIndex]).replace(links[linkIndex], "").replace(/[*+^${}()|[\]\\]/g, '').replace(title, "");


          request(`${links[linkIndex]}`, async (
            error,
            response,
            body
          ) => {
            if (error) {
              console.log(error)
              errFunc.run(client, targetChannel, ``, `Ismeretlen hiba!`, ``, error);
              return;
            }
            const soup = new JSSoup(body);
            let images = soup.findAll('div', {
              class: "herald-post-thumbnail"
            }).map(t => t.toString());

            const soup2 = new JSSoup(images[0]);
            let img = soup.findAll('img', {
              class: "attachment-herald-lay-single"
            }).map(t => t.toString());

            const pictureUrl = await img[0].split('src="').pop().split('"')[0].trim();

            try {
              const newsEmbed = new Discord.MessageEmbed()
                .setColor('#009999')
                .setTitle(title)
                .setThumbnail(`https://www.filmtekercs.hu/wp-content/uploads/2021/03/logo.jpg`)
                .setURL(`${links[linkIndex]}`)
                .setFooter(textBody)
                .setImage(`${pictureUrl}`)

              await targetChannel.send(newsEmbed)
            } catch (error) {
              console.log(error)
              errFunc.run(client, targetChannel, ``, `Ismeretlen hiba!`, ``, error);
              return;
            }
          });
        });
        break;

        //--------------------------------------------------------------------------------------------------------------------------------

      default:
        //Send Help Panel
        const args = await module.exports.news_args;
        const argsArray = Object.values(args);
        const size = argsArray.length;

        let helpEmbed = new Discord.MessageEmbed()
          .setColor("#0000FF")
          .setTitle(`${message.author.username}, nem létezik "${arg}" téma.`)
          .setDescription(`Elérhető témák:`)
          .setFooter(`${prefix}hír [Téma] --- Prefix: ${prefix}`)

        if (arg == "") {
          helpEmbed.setTitle(`${message.author.username}, kérlek adj meg egy témát.`)
        }

        argsArray.forEach(async (item, i) => {
          const name = (item.name.charAt(0).toUpperCase() + item.name.slice(1));

          switch (item.name) {
            case "game":
              if (UseOneChannelNews == "true") {
                helpEmbed.addField(`─ ${name} ─`, `**| ** ${item.description}\n**| ** ${item.example}\n**| Hol használható?** ${newsChannel}`, true);
              } else {
                helpEmbed.addField(`─ ${name} ─`, `**| ** ${item.description}\n**| ** ${item.example}\n**| Hol használható?** Bárhol`, true);
              }
              break;
            case "tech":
              if (UseOneChannelNews == "true") {
                helpEmbed.addField(`─ ${name} ─`, `**| ** ${item.description}\n**| ** ${item.example}\n**| Hol használható?** ${newsChannel}`, true);
              } else {
                helpEmbed.addField(`─ ${name} ─`, `**| ** ${item.description}\n**| ** ${item.example}\n**| Hol használható?** Bárhol`, true);
              }
              break;
            case "film":
              if (UseOneChannelNews == "true") {
                helpEmbed.addField(`─ ${name} ─`, `**| ** ${item.description}\n**| ** ${item.example}\n**| Hol használható?** ${newsChannel}`, true);
              } else {
                helpEmbed.addField(`─ ${name} ─`, `**| ** ${item.description}\n**| ** ${item.example}\n**| Hol használható?** Bárhol`, true);
              }
              break;
          }


          if ((i % 2 !== 0) && (i !== size - 1)) {
            await helpEmbed.addField("\u200B", "\u200B")
          }
        });
        await targetChannel.send(helpEmbed);
        return;
    }

  },


  help: {
    name: ("hír"),
    description: ("Különböző témákról cikkek lekérése."),
    example: ("[prefix]hír [Téma]"),
    tag: ("Bárki")
  },

  news_args: [{
      name: "game",
      description: "Videójátékokról és gamingről szóló téma.",
      example: "[prefix]hír game"
    },
    {
      name: "tech",
      description: "Technológiáról szóló téma.",
      example: "[prefix]hír tech"
    },
    {
      name: "film",
      description: "Filmekről és sorozatokról szóló téma.",
      example: "[prefix]hír film"
    }
  ]
}
