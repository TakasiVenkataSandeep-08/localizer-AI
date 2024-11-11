const { chunk } = require("llm-chunk");
const localeConfig = require("../localizer-ai.config.json");

/**
 * Splits a text into chunks of specified maximum length while preserving paragraphs
 * @param {string} text The input text to split
 * @param {number} maxLength Maximum length for each chunk
 * @returns {string[]} Array of text chunks
 */
const splitIntoChunks = (text, maxLength = 2000) => {
  const sentences = chunk(text, {
    maxTokens: maxLength,
    overlap: 0,
    splitter: "sentence",
  });
  const chunks = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length + 1 <= maxLength) {
      currentChunk += (currentChunk ? "\n\n" : "") + sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = sentence;
    }
  }

  if (currentChunk) chunks.push(currentChunk);
  return chunks;
};

const getContext = (pathToContext) => {
  const localeContext = localeConfig.localeContext;
  return localeContext[pathToContext] || "";
};

module.exports = { splitIntoChunks, getContext };
