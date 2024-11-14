const { execSync } = require("child_process");
const dotenv = require("dotenv");
dotenv.config();

/**
 * Gets the OpenAI API key from npm config
 * @returns {string} The OpenAI API key
 */
const getApiKey = (keyName = "openai-key") => {
  try {
    const apiKey = execSync(`npm config get ${keyName}`, {
      encoding: "utf-8",
    }).trim();

    if (!apiKey) {
      console.error("\n❌ Error: API key not found.");
      console.info(
        `Please set your ${keyName} using:\n` +
          `npm config set -g ${keyName} YOUR_API_KEY\n`
      );
      process.exit(1);
    }

    return apiKey;
  } catch (error) {
    console.error("\n❌ Error: Failed to retrieve API key.");
    console.info(
      `Please set your ${keyName} using:\n` +
        `npm config set -g ${keyName} YOUR_API_KEY\n`
    );
    process.exit(1);
  }
};

module.exports = { getApiKey };
