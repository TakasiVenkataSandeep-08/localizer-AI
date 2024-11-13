const fs = require("fs");
const path = require("path");
const { translateText } = require("../pipeline.js");
const { getContext, detectFileType } = require("./common.js");

const translateNestedJson = async ({
  fileContent,
  to,
  localeFilePath,
  from = "en",
  contextFilePath,
  fileContext,
}) => {
  const cache = new Map();
  const fileType = detectFileType(localeFilePath);

  const processValue = async (value, objectPath = []) => {
    if (value === null || value === undefined) return value;

    if (typeof value === "object") {
      if (Array.isArray(value)) {
        return Promise.all(
          value.map((item, index) => processValue(item, [...objectPath, index]))
        );
      }

      const result = {};
      await Promise.all(
        Object.entries(value).map(async ([key, val]) => {
          result[key] = await processValue(val, [...objectPath, key]);
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
      const pathString = objectPath.join(".");
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

      cache.set(cacheKey, translated);
      return translated;
    } catch (error) {
      console.warn(
        `❌ Translation failed for "${value}" at path "${objectPath.join(".")}": ${error.message}`
      );
      return value;
    }
  };

  try {
    const processedContent = await processValue(fileContent);
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

    fs.mkdirSync(path.dirname(localeFilePath), { recursive: true });
    fs.writeFileSync(localeFilePath, contentToWrite);
  } catch (error) {
    console.error(`❌ Failed to process locale ${to}: ${error.message}`);
  }
};

module.exports = { translateNestedJson };
