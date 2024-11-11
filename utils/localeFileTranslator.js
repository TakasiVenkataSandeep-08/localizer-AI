const fs = require("fs");
const { translateText } = require("../pipeline.js");
const path = require("path");

/**
 * Translates a JSON object following nested paths
 * @param {Object} json - Source JSON object
 * @param {string[]} locales - Target language codes
 * @param {string} localeFilePath - Path where translated files will be saved
 * @param {string} [from="en"] - Source language code
 * @returns {Promise<Object.<string, Object>>}
 */
const translateNestedJson = async ({
  fileContent,
  locales,
  localeFilePath,
  from = "en",
  contextFilePath,
}) => {
  const translatedData = {};
  const cache = new Map();

  const processValue = async (value, to, path = []) => {
    if (value === null || value === undefined) return value;

    if (typeof value === "object") {
      if (Array.isArray(value)) {
        return Promise.all(
          value.map((item, index) => processValue(item, to, [...path, index]))
        );
      }

      const result = {};
      await Promise.all(
        Object.entries(value).map(async ([key, val]) => {
          result[key] = await processValue(val, to, [...path, key]);
        })
      );
      return result;
    }

    // Only translate strings
    if (typeof value !== "string" || !value.trim()) {
      return value;
    }

    const cacheKey = `${value}:${from}:${to}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      // Get context from nested path
      const pathString = path.join(".");
      const localeContext =
        getContext(`${contextFilePath}/${pathString}`) ||
        getContext(`${contextFilePath}/$fileContext`);

      const translated = await translateText({
        content: value,
        from,
        to,
        localeContext,
      });

      const cleanTranslated = translated.trim();
      cache.set(cacheKey, cleanTranslated);
      return cleanTranslated;
    } catch (error) {
      console.warn(
        `Translation failed for "${value}" at path "${path.join(".")}": ${error.message}`
      );
      return value;
    }
  };

  // Process all locales in parallel
  await Promise.all(
    locales.map(async (to) => {
      try {
        translatedData[to] = await processValue(fileContent, to);

        // Ensure output directory exists
        if (!fs.existsSync(path.dirname(localeFilePath))) {
          fs.mkdirSync(path.dirname(localeFilePath), { recursive: true });
        }

        fs.writeFileSync(
          localeFilePath,
          JSON.stringify(translatedData[to], null, 2)
        );
      } catch (error) {
        console.error(`Failed to process locale ${to}: ${error.message}`);
      }
    })
  );

  return translatedData;
};

module.exports = { translateNestedJson };
