const OpenAI = require("openai");

const { openAiKey } = require("../config/common");

console.log("openAiKey", openAiKey);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: openAiKey, // Make sure to set this in your environment
});

/**
 * @typedef {Object} AskAIInput
 * @property {string} question
 */

/**
 * @param {AskAIInput} input
 * @returns {Promise<string>}
 */
const askAI = async ({ question, systemPrompt }) => {
  if (!question) {
    throw new Error("Question is required");
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", // or "gpt-3.5-turbo" for a cheaper alternative
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: question },
    ],
    temperature: 0.7,
  });

  return response.choices[0].message.content;
};

module.exports = { askAI };
