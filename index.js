const { commandExecutor } = require("./src/cli/commandExecutor.js");

(async function () {
  await commandExecutor();
})();
