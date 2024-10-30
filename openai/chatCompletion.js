const { openai } = require("./index");
const createCompletion = async (messages, model = "gpt-3.5-turbo-0125") => {
  const response = await openai.chat.completions.create({
    model,
    messages,
    seed: 0,
    temperature: 0,
  });
  const chatResponse = response?.choices?.[0]?.message?.content || "";
  return chatResponse;
};

module.exports = { createCompletion };
