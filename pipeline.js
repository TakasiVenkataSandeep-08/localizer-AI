const { systemMessage } = require("./constants/systemMessage.js");
const { createCompletion } = require("./openai/chatCompletion.js");
const { splitTextIntoChunks } = require("./utils/exceededTokenHandler.js");
/**
 * Translates the given content from one language to another using OpenAI's GPT-3 model.
 *
 * @param {Object} options - The options for translation.
 * @param {string} options.content - The content to be translated.
 * @param {string} options.from - The language code of the source language.
 * @param {string} options.to - The language code of the target language.
 * @return {Promise<string>} The translated content.
 */
async function translateText({ content, from, to }) {
  const textChunks = splitTextIntoChunks(content);
  const systemMessageWithFrom = systemMessage.replace("$from", from);
  const systemMessageWithFromAndTo = systemMessageWithFrom.replace("$to", to);
  const messages = [{ role: "system", content: systemMessageWithFromAndTo }];
  const responses = await Promise.all(
    textChunks.map(async (text) =>
      createCompletion([
        ...messages,
        { role: "user", content: `Translate the text: '${text}'` },
      ])
    )
  );
  return responses.reduce((acc, text) => acc + text, "");
}

module.exports = { translateText };
