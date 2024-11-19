const { getApiKey } = require("../config/common");
const { Mistral } = require("@mistralai/mistralai");
const { getValueFromConfig } = require("../utils/common");

const apiKey = getApiKey("mistralai-key");

const client = new Mistral({ apiKey: apiKey });
let llmConfig;

/**
 * Sends a question to the Mistral AI model and returns its response
 * @param {Object} params - The parameters for the AI query
 * @param {string} params.question - The user's question to be answered by the AI
 * @param {string} params.systemPrompt - The system prompt that sets the context/behavior for the AI
 * @returns {Promise<string>} The AI's response text
 */
const askMistralAI = async ({ question, systemPrompt }) => {
  if (!question) {
    throw new Error("Question is required");
  }
  if (!llmConfig) {
    llmConfig = getValueFromConfig("llmConfig");
  }

  const chatResponse = await client.chat.complete({
    model: "open-mistral-nemo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: question },
    ],
    ...llmConfig,
  });

  return chatResponse.choices[0].message.content;
};

module.exports = { askMistralAI };
