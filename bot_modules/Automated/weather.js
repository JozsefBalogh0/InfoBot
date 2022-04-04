const http = require('http');
const JSSoup = require('jssoup').default;
const request = require('request');
const textVersion = require("textversionjs");
const Discord = require('discord.js');
const encodeUrl = require('encodeurl');
const path = require('path')
const Jimp = require('jimp');
const PORT = 3000;
const sleep = require('sleep-promise');

const sunTimes = require("../../Data/sunTimes.json")

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World');
});


module.exports = {
  run: async (client, channel, settlement, auto=false) => {
    //Get data from automated call and pass it back to the main function
    if (auto) {
      for (const item of client.guildConfigs) {
        await item;
        const guildConfig = client.guildConfigs.get(item[0]);
        const configMap = new Map(Object.entries(guildConfig[0]))
        const configKeys = Object.keys(guildConfig[0])

        let UseAutoWeather = false;
        let guildID;
        let channelID;
        let settlement;

        configKeys.map(x => {
          if (x == "DATA") {
            configMap.get(x).map(y => {
              guildID = y.guild;
              settlement = y.AutoWeatherCity;

              UseAutoWeather = y.Booleans.UseAutoWeather;

              channelID = y.Channels.AutomatedWeatherChannel;
            });
          }
        });


        if (UseAutoWeather == "true") {
          settlement = settlement.charAt(0).toUpperCase() + settlement.slice(1);

          const guild = await client.guilds.cache.get(guildID);
          const targetChannel = await client.channels.fetch(channelID);
          const func = await client.automatedFunctions.get("időjárásAutomatic");
          await sleep(2000);
          await func.run(client, targetChannel, settlement);
        } else {
          continue;
        }
      }
    }
    if (channel == "") {return;}


    const date_ob = new Date();
    const errFunc = await client.basicFunctions.get("sendErrorReport");

    const hours = ("0" + (date_ob.getHours())).slice(-2);
    const minutes = ("0" + (date_ob.getMinutes())).slice(-2);

    const date = ("0" + date_ob.getDate()).slice(-2);
    const month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    const year = date_ob.getFullYear();

    const sunTimesMap = new Map(Object.entries(sunTimes[0]))
    const sunTimesKeys = Object.keys(sunTimes[0])

    let SunUp, SunDown;
    await sunTimesKeys.map(x => {
      if (x == month) {
        ({
          SunUp,
          SunDown
        } = sunTimesMap.get(x));
      }
    });

    let mode = "night";
    if ((hours >= SunUp) && (hours <= SunDown)) {
      mode = "day";
    }

    const urlInput = await encodeUrl(settlement);
    request(`https://www.idokep.hu/idojaras/${urlInput}`, async (
      error,
      response,
      body
    ) => {
      if (error) {
        console.log(error)
        errFunc.run(client, channel, ``, `Ismeretlen hiba!`, ``, error);
        return;
      }
      const soup = new JSSoup(body);

      //Web scraping
      const tempDivs = soup.findAll('div', {
        "class": "current-temperature"
      }).map(t => t.toString());
      const weatherDivs = soup.findAll('div', {
        "class": "current-weather"
      }).map(t => t.toString());
      let href = soup.findAll('a').map(t => t.toString());
      let links = [];
      let data = [];
      let textBody;

      const temp = textVersion(tempDivs[0].replace("˚C", "").trim());
      const status = textVersion(weatherDivs[0].trim());

      request(`https://www.idokep.hu/elorejelzes/${urlInput}`, async (
        error,
        response,
        body
      ) => {
        if (error) {
          console.log(error)
          errFunc.run(client, channel, ``, `Ismeretlen hiba!`, ``, error);
          return;
        }
        const soup = new JSSoup(body);

        //Web scraping
        const forecastDivs = soup.findAll('div', {
          "class": "new-hourly-forecast-card"
        }).map(t => t.toString());
        const soup2 = new JSSoup(forecastDivs[0]);

        const rainChanceDiv = soup2.findAll('div', {
          "class": "hourly-rain-chance"
        }).map(t => t.toString());

        let rainChance;
        if (rainChanceDiv.length == 0) {
          rainChance = "Csapadék valószínűsége: 0%";
        } else {
          rainChance = rainChanceDiv[0].split('data-content="').pop().split('"')[0];
        }

        request(`https://anevnap.hu/`, async (
          error,
          response,
          body
        ) => {
          if (error) {
            console.log(error)
            errFunc.run(client, channel, ``, `Ismeretlen hiba!`, ``, error);
            return;
          }
          const soup = new JSSoup(body);

          //Web scraping
          const nameSpan = soup.findAll('span', {
            "class": "nevnapkiemel"
          }).map(t => t.toString());

          const name = textVersion(nameSpan).trim();

          let daySrc;
          let nightSrc;
          let placeIcon = true;

          //ICON SELECTOR
          switch (status.trim()) {
            case "Derült":
              daySrc = "../../Assets/Day/Icons/derult.png";
              nightSrc = "../../Assets/Night/Icons/derult.png";
              break;
              //----------------------------------------------------------------------------------------------------------------------------------------------------------
            case "Gyengén felhős":
              daySrc = "../../Assets/Day/Icons/gyengen_felhos.png";
              nightSrc = "../../Assets/Night/Icons/gyengen_felhos.png";
              break;
              //----------------------------------------------------------------------------------------------------------------------------------------------------------
            case "Közepesen felhős":
              daySrc = "../../Assets/Day/Icons/kozepesen_felhos.png";
              nightSrc = "../../Assets/Night/Icons/kozepesen_felhos.png";
              break;
              //----------------------------------------------------------------------------------------------------------------------------------------------------------
            case "Erősen felhős":
              daySrc = "../../Assets/Day/Icons/erosen_felhos.png";
              nightSrc = "../../Assets/Night/Icons/erosen_felhos.png";
              break;
              //----------------------------------------------------------------------------------------------------------------------------------------------------------
            case "Borult":
              daySrc = "../../Assets/Day/Icons/borult.png";
              nightSrc = "../../Assets/Night/Icons/borult.png";
              break;
              //----------------------------------------------------------------------------------------------------------------------------------------------------------
            case "Pára":
              daySrc = "../../Assets/Day/Icons/kod-para.png";
              nightSrc = "../../Assets/Night/Icons/kod-para.png";
              break;
              //----------------------------------------------------------------------------------------------------------------------------------------------------------
            case "Köd":
              daySrc = "../../Assets/Day/Icons/kod-para.png";
              nightSrc = "../../Assets/Night/Icons/kod-para.png";
              break;
              //----------------------------------------------------------------------------------------------------------------------------------------------------------
            case "Ködszitálás":
              daySrc = "../../Assets/Day/Icons/kodszitalas.png";
              nightSrc = "../../Assets/Night/Icons/kodszitalas.png";
              break;
              //----------------------------------------------------------------------------------------------------------------------------------------------------------
            case "Gyenge eső":
              daySrc = "../../Assets/Day/Icons/gyenge_eso.png";
              nightSrc = "../../Assets/Night/Icons/gyenge_eso.png";
              break;
              //----------------------------------------------------------------------------------------------------------------------------------------------------------
            case "Szitálás":
              daySrc = "../../Assets/Day/Icons/eso.png";
              nightSrc = "../../Assets/Night/Icons/eso.png";
              break;
              //----------------------------------------------------------------------------------------------------------------------------------------------------------
            case "Zápor":
              daySrc = "../../Assets/Day/Icons/zapor.png";
              nightSrc = "../../Assets/Night/Icons/zapor.png";
              break;
              //----------------------------------------------------------------------------------------------------------------------------------------------------------
            case "Havas eső":
              daySrc = "../../Assets/Day/Icons/havas_eso.png";
              nightSrc = "../../Assets/Night/Icons/havas_eso.png";
              break;
              //----------------------------------------------------------------------------------------------------------------------------------------------------------
            case "Hószállingózás":
              daySrc = "../../Assets/Day/Icons/hoszallingozas.png";
              nightSrc = "../../Assets/Night/Icons/hoszallingozas.png";
              break;
              //----------------------------------------------------------------------------------------------------------------------------------------------------------
            case "Hózápor":
              daySrc = "../../Assets/Day/Icons/havazas.png";
              nightSrc = "../../Assets/Night/Icons/havazas.png";
              break;
              //----------------------------------------------------------------------------------------------------------------------------------------------------------
            default:
              if (status.toLowerCase().includes("eső")) {
                daySrc = "../../Assets/Day/Icons/eso.png";
                nightSrc = "../../Assets/Night/Icons/eso.png";
              } else if (status.toLowerCase().includes("hó")) {
                daySrc = "../../Assets/Day/Icons/ho.png";
                nightSrc = "../../Assets/Night/Icons/ho.png";
              } else if (status.toLowerCase().includes("havazás")) {
                daySrc = "../../Assets/Day/Icons/havazas.png";
                nightSrc = "../../Assets/Night/Icons/havazas.png";
              } else {
                //Nincs ilyenhez ikon
                placeIcon = false;
              }
          }
          //ICON SELECTOR END

          let embedColor;
          let fileAttachment;
          let editedFileName;
          let tempX = 65;

          switch (mode) {
            case "day":
              editedFileName = "Edit.png";
              const dayFilePath = "../../Assets/Day/Images/";
              const dayFileName = 'Template.png';

              const dayImage = await Jimp.read(path.join(__dirname, dayFilePath, dayFileName));
              const dayIconImage = await Jimp.read(path.join(__dirname, daySrc));

              const dayFont = await Jimp.loadFont(path.join(__dirname, "../../Assets/Fonts/Berlin-sans-FB-Demi-black/Berlin-sans-FV-Demi-black.fnt"));
              const dayDateFont = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);

              //Print Settlement Name
              await dayImage.print(dayFont, 140, 60, `${settlement.toUpperCase().replaceAll("ő", "ö").replaceAll("Ő", "Ö").replaceAll("ű", "ü").replaceAll("Ű", "Ü")}`);
              //Print Name
              await dayImage.print(dayFont, 250, 370, `${name.replaceAll("ő", "ö").replaceAll("Ő", "Ö").replaceAll("ű", "ü").replaceAll("Ű", "Ü")}`);
              //Print Temperature
              if (temp.trim().replace("-", "").length == 1) {
                tempX = 90;
              }
              if (temp.trim().includes("-") && temp.trim().replace("-", "").length == 1) {
                tempX = 80;
              }
              await dayImage.print(dayFont, tempX, 143, `${temp}`);
              //Print Status
              await dayImage.print(dayFont, 140, 220, `${status.replaceAll("ő", "ö").replaceAll("Ő", "Ö").replaceAll("ű", "ü").replaceAll("Ű", "Ü")}`);
              //Print Rain Chance
              await dayImage.print(dayDateFont, 110, 440, `${rainChance.replaceAll("ő", "ö").replaceAll("Ő", "Ö").replaceAll("ű", "ü").replaceAll("Ű", "Ü")}`);
              //Print Current Date and Time
              await dayImage.print(dayDateFont, 140, 110, `${year}-${month}-${date}   ${hours}:${minutes}`)
              //Print Icon
              if (placeIcon) {
                await dayIconImage.resize(70, 70);
                await dayImage.composite(dayIconImage, 45, 210);
              }


              await dayImage.writeAsync(path.join(__dirname, dayFilePath, editedFileName));

              fileAttachment = new Discord.MessageAttachment(path.join(__dirname, dayFilePath, editedFileName), editedFileName);
              embedColor = `#0a91be`
              break;

              //----------------------------------------------------------------------------------------------------------------------------------------------------------

            case "night":
              editedFileName = "Edit.png";
              const nightFilePath = "../../Assets/Night/Images/";
              const nightFileName = 'Template.png';

              const nightImage = await Jimp.read(path.join(__dirname, nightFilePath, nightFileName));
              const nightIconImage = await Jimp.read(path.join(__dirname, nightSrc));

              const nightFont = await Jimp.loadFont(path.join(__dirname, "../../Assets/Fonts/Berlin-sans-FB-Demi-white/Berlin-sans-FB-Demi-white.fnt"));
              const nightDateFont = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);

              //Print Settlement Name
              await nightImage.print(nightFont, 140, 60, `${settlement.toUpperCase().replaceAll("ő", "ö").replaceAll("Ő", "Ö").replaceAll("ű", "ü").replaceAll("Ű", "Ü")}`);
              //Print Name
              await nightImage.print(nightFont, 250, 370, `${name.replaceAll("ő", "ö").replaceAll("Ő", "Ö").replaceAll("ű", "ü").replaceAll("Ű", "Ü")}`);
              //Print Temperature
              if (temp.trim().replace("-", "").length == 1) {
                tempX = 90;
              }
              if (temp.trim().includes("-") && temp.trim().replace("-", "").length == 1) {
                tempX = 80;
              }
              await nightImage.print(nightFont, tempX, 143, `${temp}`);
              //Print Status
              await nightImage.print(nightFont, 140, 220, `${status.replaceAll("ő", "ö").replaceAll("Ő", "Ö").replaceAll("ű", "ü").replaceAll("Ű", "Ü")}`);
              //Print Rain Chance
              await nightImage.print(nightDateFont, 110, 440, `${rainChance.replaceAll("ő", "ö").replaceAll("Ő", "Ö").replaceAll("ű", "ü").replaceAll("Ű", "Ü")}`);
              //Print Current Date and Time
              await nightImage.print(nightDateFont, 140, 110, `${year}-${month}-${date}   ${hours}:${minutes}`)
              //Print Icon
              if (placeIcon) {
                await nightIconImage.resize(70, 70);
                await nightImage.composite(nightIconImage, 45, 210);
              }


              await nightImage.writeAsync(path.join(__dirname, nightFilePath, editedFileName));

              fileAttachment = new Discord.MessageAttachment(path.join(__dirname, nightFilePath, editedFileName), editedFileName);
              embedColor = `#0f0546`
              break;
          }
          try {
            const weatherEmbed = new Discord.MessageEmbed()
              .setColor(embedColor)
              .setTitle(`${settlement} Időjárás jelentés`)
              .attachFiles(fileAttachment)
              .setImage(`attachment://${editedFileName}`)

            await channel.send(weatherEmbed);
            return;

          } catch (error) {
            console.log(error)
            errFunc.run(client, channel, ``, `Ismeretlen hiba!`, ``, error);
            return;
          }
        });
      });
    });
  },


  help: {
    name: ("időjárásAutomatic"),
  }
}
