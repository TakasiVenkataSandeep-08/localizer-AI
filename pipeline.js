const { askAI } = require("./ai/index.js");
const { splitIntoChunks } = require("./utils/common.js");

/**
 * Translates the given content from one language to another using OpenAI's GPT-3 model.
 *
 * @param {Object} options - The options for translation.
 * @param {string} options.content - The content to translate
 * @param {string} options.from - The source language
 * @param {string} options.to - The target language
 * @return {Promise<string>} The translated content.
 */
async function translateText({ content, from, to, localeContext }) {
  const textChunks = splitIntoChunks(content);

  const responses = await Promise.all(
    textChunks.map(async (text) =>
      askAI({
        question: localeContext
          ? `You are a professional translator. Translate the following text from ${from} to ${to} with high accuracy:

        Original Text (${from}): "${text}"

        Context: "${localeContext}"

        Requirements:
        - Maintain the original tone and style
        - Preserve any formatting, special characters, or placeholders
        - Ensure cultural appropriateness for the target language
        - Keep technical terms consistent
        - Match the original text's formality level

        Respond with the translation only, no explanations.`
          : `You are a professional translator. Translate the following text from ${from} to ${to} with high accuracy:

        Original Text (${from}): "${text}"

        Requirements:
        - Maintain the original tone and style
        - Preserve any formatting, special characters, or placeholders
        - Ensure cultural appropriateness for the target language
        - Keep technical terms consistent
        - Match the original text's formality level

        Respond with the translation only, no explanations.`,
      })
    )
  );

  const translatedText = responses.reduce((acc, text) => acc + text, "");
  console.log(translatedText);

  return translatedText;
}

module.exports = { translateText };
