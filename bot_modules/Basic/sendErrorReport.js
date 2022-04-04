const Discord = require('discord.js');
const path = require('path')
const Jimp = require('jimp');


module.exports = {
  run: async (client, channel, footer, title, text, error) => {
    const func = await client.basicFunctions.get("getFromConfig");


    const editedFileName = "Edit.jpg";
    const errTemplatePath = "../../Assets/Error_Img/";
    const errTemplateName = 'Template.png';

    const errImage = await Jimp.read(path.join(__dirname, errTemplatePath, errTemplateName));

    const errFontLarge = await Jimp.loadFont(path.join(__dirname, "../../Assets/Fonts/Berlin-sans-FB-Demi-black-large/Berlin-sans-FV-Demi-black-large.fnt"));
    const errFont = await Jimp.loadFont(path.join(__dirname, "../../Assets/Fonts/Berlin-sans-FB-Demi-black/Berlin-sans-FV-Demi-black.fnt"));

    const newLine = 40;
    let textStartLine = 100;

    //Simulate Line Break and Print Main Text
    const texts = text.split('\n');
    if (texts) {
      await texts.forEach(async(item, i) => {
        await errImage.print(errFont, 350, textStartLine+(i*newLine), `${item.replaceAll("ő", "ö").replaceAll("Ő", "Ö").replaceAll("ű", "ü").replaceAll("Ű", "Ü")}`);
      })
    }

    //Print Rest of Error Text
    //Title
    await errImage.print(errFontLarge, 20, 10, `${title.replaceAll("ő", "ö").replaceAll("Ő", "Ö").replaceAll("ű", "ü").replaceAll("Ű", "Ü")}`);
    //Footer
    await errImage.print(errFont, 350, 400, `${footer.replaceAll("ő", "ö").replaceAll("Ő", "Ö").replaceAll("ű", "ü").replaceAll("Ű", "Ü")}`);


    await errImage.writeAsync(path.join(__dirname, errTemplatePath, editedFileName));

    const fileAttachment = new Discord.MessageAttachment(path.join(__dirname, errTemplatePath, editedFileName), editedFileName);



    const errEmbed = new Discord.MessageEmbed()
      .setColor(`#FF0000`)
      .attachFiles(fileAttachment)
      .setImage(`attachment://${editedFileName}`)
    if (error) {
      errEmbed.setFooter(`${error}`)
    }

    await channel.send(errEmbed);

  },


  help: {
    name: ("sendErrorReport"),
  }
}
