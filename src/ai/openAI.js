const OpenAI = require("openai");

const { getApiKey } = require("../config/common");
const { getValueFromConfig } = require("../utils/common");
let llmConfig;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: getApiKey("openai-key"), // Make sure to set this in your environment
});

/**
 * @typedef {Object} AskAIInput
 * @property {string} question
 */

/**
 * @param {AskAIInput} input
 * @returns {Promise<string>}
 */
const askOpenAI = async ({ question, systemPrompt }) => {
  if (!question) {
    throw new Error("Question is required");
  }
  if (!llmConfig) {
    llmConfig = getValueFromConfig("llmConfig");
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: question },
    ],
    temperature: 0.4,
    ...llmConfig,
  });

  return response.choices[0].message.content;
};

module.exports = { askOpenAI };
