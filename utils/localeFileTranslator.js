const fs = require("fs");
const { translateText } = require("../pipeline");
const translateLocales = async (value, to, from = "en") => {
  if (typeof value === "object") {
    if (Array.isArray(value)) {
      const translatedArray = [];
      await Promise.all(
        value.map(async (el) => {
          const translatedText = await translateLocales(el, to);
          translatedArray.push(translatedText);
        })
      );
      return translatedArray;
    } else {
      const accumulator = {};
      await Promise.all(
        Object.entries(value).map(async ([key, keyValue]) => {
          accumulator[key] = await translateLocales(keyValue, to);
        })
      );
      return accumulator;
    }
  } else {
    const translatedData = await translateText(value, {
      from,
      to,
    });
    return translatedData.text;
  }
};
const translateJson = async (json, locales, from = "en") => {
  const translatedData = {};
  await Promise.all(
    locales.map(async (to) => {
      const localeSpecificData = {};
      await Promise.all(
        Object.entries(json).map(async ([key, value]) => {
          localeSpecificData[key] = await translateLocales(value, to, from);
        })
      );
      fs.appendFile(
        `${to}.json`,
        JSON.stringify(localeSpecificData),
        function (err) {
          if (err) throw err;
          console.log("Saved!");
        }
      );
      translatedData[to] = localeSpecificData;
    })
  );

  return translatedData;
};

module.exports = { translateJson };
