const fs = require("fs");
const { translateText } = require("../pipeline.js");
const path = require("path");
const { getContext } = require("./common.js");
const { detectFileType } = require("./common.js");

/**
 * Translates a JSON object following nested paths
 * @param {Object} json - Source JSON object
 * @param {string[]} locales - Target language codes
 * @param {string} localeFilePath - Path where translated files will be saved
 * @param {string} [from="en"] - Source language code
 * @param {string} [contextFilePath] - Path to the context file
 * @param {string} [fileContext] - Context from the file
 * @returns {Promise<Object.<string, Object>>}
 */
const translateNestedJson = async ({
  fileContent,
  locales,
  localeFilePath,
  from = "en",
  contextFilePath,
  fileContext,
}) => {
  const translatedData = {};
  const cache = new Map();
  const fileType = detectFileType(localeFilePath);

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
        fileContext ||
        getContext(`${contextFilePath}/${pathString}`) ||
        getContext(`${contextFilePath}/$fileContext`);

      const translated = await translateText({
        content: value,
        from,
        to,
        localeContext,
        fileType: "txt",
      });

      // Cache the result
      cache.set(cacheKey, translated);
      return translated;
    } catch (error) {
      console.warn(
        `❌ Translation failed for "${value}" at path "${path.join(".")}": ${error.message}`
      );
      return value;
    }
  };

  // Process all locales in parallel but with locale-specific paths
  await Promise.all(
    locales.map(async (to) => {
      try {
        const processedContent = await processValue(fileContent, to);
        let contentToWrite = processedContent;

        if (fileType === "json") {
          if (typeof processedContent === "object") {
            contentToWrite = JSON.stringify(processedContent, null, 2);
          } else {
            throw new Error("Invalid JSON content after translation");
          }
        } else {
          if (typeof processedContent !== "string") {
            contentToWrite = String(processedContent);
          }
        }

        translatedData[to] = processedContent;

        // Generate locale-specific file path
        const localeSpecificPath = localeFilePath.replace(
          /^(.*?\/)?([^/]+)$/,
          `$1${to}/$2`
        );

        // Ensure output directory exists
        const outputDir = path.dirname(localeSpecificPath);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        // Write the file with locale-specific path
        fs.writeFileSync(localeSpecificPath, contentToWrite);
      } catch (error) {
        console.error(`❌ Failed to process locale ${to}: ${error.message}`);
      }
    })
  );

  return translatedData;
};

module.exports = { translateNestedJson };
