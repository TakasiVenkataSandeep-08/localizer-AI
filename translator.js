#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { createSpinner } = require("./spinner.js");
const { translateText } = require("./pipeline.js");

/**
 * Displays a welcome message to the user.
 */
function displayWelcomeMessage() {
  console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$");
  console.log("$    _________    _         $");
  console.log("$   / ________|  | |        $");
  console.log("$  |  |          | |        $");
  console.log("$  |  |          | |        $");
  console.log("$  |  |_______   | |_____   $");
  console.log("$   \\_________|  |_______|  $");
  console.log("$                           $");
  console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$\n");
  console.log("Welcome to Content Localizer!\n");
  console.log(
    "Explore more at https://www.npmjs.com/package/content-localizer\n"
  );
}

/**
 * Parses command-line arguments and returns an options object.
 * @returns {Object} An options object containing source, fileTypes, and locales.
 */
function parseCommandLineArgs() {
  const args = process.argv.slice(2);
  const options = {
    source: "",
    fileTypes: [],
    locales: [],
    from: "en",
    destination: "",
  };

  displayWelcomeMessage();

  for (let i = 0; i < args.length; i++) {
    const allowExtractArgs =
      i < args.length - 1 && !args[i + 1]?.startsWith("--");
    if (args[i] === "--source" && allowExtractArgs) {
      options.source = args[i + 1]?.trim();
    } else if (args[i] === "--destination" && allowExtractArgs) {
      options.destination = args[i + 1]?.trim();
    } else if (args[i] === "--fileTypes" && allowExtractArgs) {
      const fileTypes = args[i + 1];
      if (!!fileTypes) {
        options.fileTypes = fileTypes
          .split(",")
          .map((fileType) => fileType?.trim());
      }
    } else if (args[i] === "--locales" && allowExtractArgs) {
      const localesString = args[i + 1];
      if (!!localesString) {
        options.locales = localesString
          .split(",")
          .map((locale) => locale?.trim());
      }
    } else if (args[i] === "--from" && allowExtractArgs) {
      options.from = args[i + 1]?.trim() || "en";
    }
  }

  if (!options.source || !options.fileTypes.length || !options.locales.length) {
    console.error(
      "Error: --source, --fileTypes, and --locales options are required.\n"
    );
    process.exit(1);
  }

  // Check if the source directory exists
  if (
    !fs.existsSync(options.source) ||
    !fs.statSync(options.source).isDirectory()
  ) {
    console.error(
      `Error: The specified source directory '${options.source}' does not exist.\n`
    );
    process.exit(1);
  }

  return options;
}

/**
 * Replicates files in the source directory to target directories with translations.
 * @param {string} sourcePath - Source directory path.
 * @param {Array} locales - Array of target locales.
 * @param {string} fileTypes - File types to translate.
 */
async function replicateFiles(
  sourcePath,
  locales,
  fileTypes,
  from,
  destinationPath
) {
  const spinner = createSpinner(); // Create a custom spinner
  spinner.start();
  console.log("Please wait while we work our magic...\n");
  const localeSuccess = {};
  async function replicateFolder(sourceFolder, targetFolder) {
    await Promise.all(
      fs.readdirSync(sourceFolder).map(async (item) => {
        const sourceItemPath = path.join(sourceFolder, item);
        const targetItemPath = path.join(targetFolder, item);

        if (fs.statSync(sourceItemPath).isDirectory()) {
          await replicateFolder(sourceItemPath, targetItemPath);
        } else if (fileTypes.some((fileType) => item.endsWith(fileType))) {
          const fileContent = fs.readFileSync(sourceItemPath, "utf8");

          await Promise.all(
            locales.map(async (locale) => {
              const localeFilePath = path.join(
                destinationPath ? `${destinationPath}/${locale}` : locale,
                targetItemPath
              );
              fs.mkdirSync(path.dirname(localeFilePath), { recursive: true });

              try {
                let translatedData;
                if (item.endsWith(".json")) {
                } else {
                  translatedData = await translateText({
                    content: `${fileContent}`,
                    from,
                    to: locale,
                  });
                }
                fs.writeFileSync(localeFilePath, translatedData, "utf8");
                if (
                  (locale in localeSuccess && !localeSuccess[locale]) ||
                  localeSuccess[locale]
                )
                  return;
                localeSuccess[locale] = true;
              } catch (error) {
                console.warn(
                  `Error translating file ${localeFilePath}: ${error.message}\n`
                );
                if (
                  (locale in localeSuccess && !localeSuccess[locale]) ||
                  localeSuccess[locale] === false
                )
                  return;
                localeSuccess[locale] = false;
              }
            })
          );
        }
      })
    );
  }

  await replicateFolder(sourcePath, "");
  locales.forEach((locale) => {
    spinner.setLocaleStatus(locale, localeSuccess[locale] ? "✅" : "❌");
  });
  spinner.stopAndPersist(); // Show final status for all locales
}

function main() {
  const options = parseCommandLineArgs();
  replicateFiles(
    options.source,
    options.locales,
    options.fileTypes,
    options.from,
    options.destination
  );
}

main();
