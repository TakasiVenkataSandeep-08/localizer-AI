const { execSync } = require("child_process");

const openAiKey = execSync("npm config get openai-key", {
  encoding: "utf-8",
}).trim();
module.exports = {
  openAiKey,
};
