#!/usr/bin/env node
const { displayWelcomeMessage } = require("../utils/welcomeMessage.js");
const {
  handleCreateConfigFile,
} = require("../commandHandlers/createConfig.js");
const {
  handleTranslateLocales,
} = require("../commandHandlers/translateLocales.js");

/**
 * Parses command-line arguments and executes the corresponding command.
 *
 * Available commands:
 * - create-config: Creates a new configuration file with user input
 * - translate: Translates files according to config settings
 *
 * @async
 * @returns {Promise<void>} Resolves when command execution is complete
 * @throws {Error} If an invalid command is provided
 */
async function commandExecutor() {
  displayWelcomeMessage();
  const args = process.argv.slice(2);
  if (args.includes("create-config")) {
    await handleCreateConfigFile();
    process.exit(0);
  } else if (args.includes("translate")) {
    await handleTranslateLocales();
    process.exit(0);
  } else {
    if (!args.includes("help")) {
      console.error("❌ Error: Invalid command. Please try again.\n");
    }
    console.log("✅ Available commands:\n");
    console.log("  help            : Show help");
    console.log("  create-config   : Create a new configuration file");
    console.log("  translate       : Translate locale files");
    process.exit(1);
  }
}

module.exports = { commandExecutor };
