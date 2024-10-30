const OpenAI = require("openai");
const { openAiKey } = require("../config/common");

const openai = new OpenAI({
  apiKey: openAiKey,
});

module.exports = { openai };
