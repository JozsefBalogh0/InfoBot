const config = require('../../Data/config.json')

module.exports = {
  run: async (dataToGet, callback) => {
    const configMap = await new Map(Object.entries(config[0]))
    const configKeys = await Object.keys(config[0])

    let returned;
    //GENERAL DATA
    await configKeys.map(async (x) => {
      if (x == "DATA") {
        await configMap.get(x).map(async (y) => {
          returned = await y[dataToGet];
        });
      }
    });

    callback(returned);
  },


  help: {
    name: ("getFromConfig")
  }
}
