const { askAI } = require("./ai/index.js");
const { createFormatTemplate } = require("./utils/common.js");
const { translateCleaner } = require("./utils/common.js");
const { systemPrompt } = require("./utils/prompt.js");

/**
 * Translates the given content from one language to another using OpenAI's GPT-3 model.
 *
 * @param {Object} options - The options for translation.
 * @param {string} options.content - The content to translate
 * @param {string} options.from - The source language
 * @param {string} options.to - The target language
 * @return {Promise<string>} The translated content.
 */
async function translateText({ content, from, to, localeContext, fileType }) {
  try {
    if (!content) {
      throw new Error("No content provided for translation");
    }

    let context = "";
    if (localeContext) {
      context = `Context:
      """
      ${localeContext}
      """`;
    }

    const updatedSystemPrompt = systemPrompt
      .replace("$context", context)
      .replace("$fileType", fileType)
      .replace("$from", from)
      .replace("$to", to);

    const { chunks, reconstruct } = createFormatTemplate(content, fileType);

    const translatedChunks = await Promise.all(
      chunks.map(async (chunk) => {
        try {
          const response = await askAI({
            question: `Text to translate:
            """
            ${chunk}
            """`,
            systemPrompt: updatedSystemPrompt,
          });

          // Apply the cleaner to the translated text
          return translateCleaner(response || chunk, chunk, fileType);
        } catch (error) {
          console.error(`Translation chunk error: ${error.message}`);
          return chunk;
        }
      })
    );

    // Use the reconstruct method to maintain exact formatting
    return reconstruct(translatedChunks);
  } catch (error) {
    console.error("Translation error:", error);
    throw new Error(`Translation failed: ${error.message}`);
  }
}

module.exports = { translateText };
