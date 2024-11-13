const { execSync } = require("child_process");
const dotenv = require("dotenv");
dotenv.config();

/**
 * Gets the OpenAI API key from npm config
 * @returns {string} The OpenAI API key
 */
const getApiKey = () => {
  try {
    const apiKey = execSync("npm config get openai-key", {
      encoding: "utf-8",
    }).trim();

    if (!apiKey) {
      console.error("\n❌ Error: OpenAI API key not found.");
      console.info(
        "Please set your OpenAI API key using:\n" +
          "npm config set -g openai-key YOUR_API_KEY\n"
      );
      process.exit(1);
    }

    return apiKey;
  } catch (error) {
    console.error("\n❌ Error: Failed to retrieve OpenAI API key.");
    console.info(
      "Please set your OpenAI API key using:\n" +
        "npm config set @ai-translator:openai-key YOUR_API_KEY\n"
    );
    process.exit(1);
  }
};

const openAiKey = getApiKey();

module.exports = { openAiKey };
