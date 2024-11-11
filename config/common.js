const { execSync } = require("child_process");
const dotenv = require("dotenv");
dotenv.config();

/**
 * Gets the OpenAI API key from npm config
 * @returns {string} The OpenAI API key
 */
const getApiKey = () => {
  try {
    const apiKey =
      process.env.OPENAI_API_KEY ||
      execSync("npm config get @ai-translator:openai-key", {
        encoding: "utf-8",
      }).trim();

    if (!apiKey) {
      console.error("\nError: OpenAI API key not found.");
      console.info(
        "Please set your OpenAI API key using:\n" +
          "npm config set @ai-translator:openai-key YOUR_API_KEY\n"
      );
      process.exit(1);
    }

    return apiKey;
  } catch (error) {
    console.error("\nError: Failed to retrieve OpenAI API key.");
    console.info(
      "Please set your OpenAI API key using:\n" +
        "npm config set @ai-translator:openai-key YOUR_API_KEY\n"
    );
    process.exit(1);
  }
};

const openAiKey = getApiKey();

module.exports = { openAiKey };
