const { replicateFiles } = require("../utils/fileReplicator.js");
const fs = require("fs");

/**
 * Handles the translation of locale files based on configuration settings.
 * This function reads the configuration from 'localizer-ai.config.json',
 * validates the required options, and initiates the file replication process
 * for different locales.
 *
 * @async
 * @throws {Error} If the config file is not found
 * @throws {Error} If required config options (source, fileTypes, locales) are missing
 * @throws {Error} If the source directory doesn't exist
 * @returns {Promise<void>} Exits the process with code 0 on success, 1 on failure
 */
async function handleTranslateLocales() {
  let configContent;
  try {
    configContent = fs.readFileSync("localizer-ai.config.json", "utf-8");
  } catch (error) {
    console.error("❌ Error: Config file not found.\n");
    console.info(
      "💡 Run 'localizer-ai --create-config' to create a config file.\n"
    );
    process.exit(1);
  }

  const configOptions = JSON.parse(configContent);

  if (
    !configOptions.source ||
    !configOptions.fileTypes.length ||
    !configOptions.locales.length
  ) {
    console.error(
      "❌ Error: source, fileTypes, and locales options are required.\n"
    );
    process.exit(1);
  }

  if (
    !fs.existsSync(configOptions.source) ||
    !fs.statSync(configOptions.source).isDirectory()
  ) {
    console.error(
      `❌ Error: The specified source directory '${configOptions.source}' does not exist.\n`
    );
    process.exit(1);
  }

  await replicateFiles(
    configOptions.source,
    configOptions.locales,
    configOptions.fileTypes,
    configOptions.from,
    configOptions.destination
  );
  process.exit(0);
}

module.exports = { handleTranslateLocales };
