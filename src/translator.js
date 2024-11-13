#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { createSpinner } = require("./spinner.js");
const { translateText } = require("./pipeline.js");
const readline = require("readline");
const { translateNestedJson } = require("./utils/localeFileTranslator.js");
const {
  getContext,
  getLocaleContextType,
  detectFileType,
} = require("./utils/common.js");

const LOCALE_CONTEXT_TYPES = {
  // FOLDER: "folder",
  FILE: "file",
  DEEP: "deep",
};

const LOCALE_CONTEXT_DESCRIPTIONS = {
  // [LOCALE_CONTEXT_TYPES.FOLDER]:
  //   "Folder-level context: Provides context for each folder path",
  [LOCALE_CONTEXT_TYPES.FILE]:
    "File-level context: Allows setting context for individual files",
  [LOCALE_CONTEXT_TYPES.DEEP]:
    "Deep context: Enables setting context for specific keys within JSON files and regular files",
};

/**
 * Displays a welcome message to the user.
 */
function displayWelcomeMessage() {
  console.log(
    "\n--------------------------------------------------------------------"
  );
  console.log(
    [
      "  _                         _  _                             _____",
      " | |                       | |(_)                     /\\    |_   _|",
      " | |      ___    ___  __ _ | | _  ____ ___  _ __     /  \\     | |",
      " | |     / _ \\  / __|/ _` || || ||_  // _ \\| '__|   / /\\ \\    | |",
      " | |____| (_) || (__| (_| || || | / /|  __/| |     / ____ \\  _| |_",
      " |______|\\___/  \\___|\\__,_||_||_|/___|\\___/|_|    /_/    \\_\\|_____|",
    ].join("\n")
  );
  console.log(
    "\n--------------------------------------------------------------------"
  );
  console.log("\n\nWelcome to Localizer AI!\n");
  console.log("Explore more at https://www.npmjs.com/package/localizer-ai\n");
}

/**
 * Creates an interactive prompt for user input
 */
function createPrompt() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

async function generateLocaleContext(sourcePath, contextType, fileTypes, rl) {
  const context = {};

  async function processFolder(folderPath, contextObj) {
    const items = fs.readdirSync(folderPath);
    const relativePath = path.relative(sourcePath, folderPath);

    // if (contextType === LOCALE_CONTEXT_TYPES.FOLDER && relativePath) {
    //   contextObj[relativePath] = "";
    // }

    for (const item of items) {
      const itemPath = path.join(folderPath, item);
      const isDirectory = fs.statSync(itemPath).isDirectory();
      const relativeItemPath = path
        .relative(sourcePath, itemPath)
        .replace(/\\/g, "/");

      if (isDirectory) {
        // if (contextType === LOCALE_CONTEXT_TYPES.FOLDER) {
        //   contextObj[relativeItemPath] = "";
        // } else {
        await processFolder(itemPath, contextObj);
        // }
      } else {
        const isValidFile = fileTypes.some((type) => item.endsWith(type));
        if (!isValidFile) continue;

        switch (contextType) {
          case LOCALE_CONTEXT_TYPES.FILE:
            contextObj[relativeItemPath] = "";
            break;
          case LOCALE_CONTEXT_TYPES.DEEP:
            if (item.endsWith(".json")) {
              const fileContent = JSON.parse(fs.readFileSync(itemPath, "utf8"));
              const nestedContext = await generateDeepContext(fileContent, rl);
              contextObj[relativeItemPath] = {
                ...nestedContext,
                $fileContext: "",
              };
            } else {
              contextObj[relativeItemPath] = "";
            }
            break;
        }
      }
    }
  }

  await processFolder(sourcePath, context);
  return context;
}

async function generateDeepContext(jsonContent, rl) {
  const context = {};

  async function processObject(obj, currentPath = "") {
    for (const [key, value] of Object.entries(obj)) {
      const newPath = currentPath ? `${currentPath}.${key}` : key;

      if (typeof value === "object" && value !== null) {
        await processObject(value, newPath);
      } else {
        // Automatically add empty string context for each key
        context[newPath] = "";
      }
    }
  }

  await processObject(jsonContent);
  return context;
}

/**
 * Creates config file with user input
 */
async function createConfigFile() {
  const rl = createPrompt();
  const config = {
    source: "",
    fileTypes: [],
    locales: [],
    from: "",
    destination: "",
    localeContextType: "",
    localeContext: {},
  };

  try {
    // Validate source directory
    while (!config.source) {
      config.source = await new Promise((resolve) => {
        rl.question("Enter source directory path: ", (answer) => {
          const path = answer.trim();
          if (!fs.existsSync(path)) {
            console.log("❌ Directory does not exist. Please try again.");
            resolve("");
          } else if (!fs.statSync(path).isDirectory()) {
            console.log("❌ Path is not a directory. Please try again.");
            resolve("");
          } else {
            resolve(path);
          }
        });
      });
    }

    // Validate file types
    while (config.fileTypes.length === 0) {
      config.fileTypes = await new Promise((resolve) => {
        rl.question(
          "Enter file types to translate (comma-separated, e.g., .txt,.md): ",
          (answer) => {
            const types = answer
              .split(",")
              .map((type) => type.trim())
              .filter((type) => type.startsWith("."));

            if (types.length === 0) {
              console.log(
                "❌ Please enter valid file extensions starting with '.'"
              );
              resolve([]);
            } else {
              resolve(types);
            }
          }
        );
      });
    }

    // Validate locales
    while (config.locales.length === 0) {
      config.locales = await new Promise((resolve) => {
        rl.question(
          "Enter target locales (comma-separated, e.g., es,fr,de): ",
          (answer) => {
            const locales = answer
              .split(",")
              .map((locale) => locale.trim().toLowerCase())
              .filter((locale) => /^[a-z]{2}(-[a-z]{2})?$/.test(locale));

            if (locales.length === 0) {
              console.log(
                "❌ Please enter valid locale codes (e.g., en, es-mx)"
              );
              resolve([]);
            } else {
              resolve(locales);
            }
          }
        );
      });
    }

    // Validate source language
    while (!config.from) {
      config.from = await new Promise((resolve) => {
        rl.question("Enter source language code (e.g., en): ", (answer) => {
          const lang = answer.trim().toLowerCase();
          if (!/^[a-z]{2}$/.test(lang)) {
            console.log("❌ Please enter a valid 2-letter language code");
            resolve("");
          } else {
            resolve(lang);
          }
        });
      });
    }

    // Optional destination directory
    config.destination = await new Promise((resolve) => {
      rl.question("Enter destination directory path (optional): ", (answer) => {
        const path = answer.trim();
        if (path && !fs.existsSync(path)) {
          fs.mkdirSync(path, { recursive: true });
          console.log(`✅ Created destination directory: ${path}`);
        }
        resolve(path);
      });
    });

    // Add locale context type selection
    while (!config.localeContextType) {
      config.localeContextType = await new Promise((resolve) => {
        console.log("\nAvailable Locale Context Types:");
        Object.entries(LOCALE_CONTEXT_DESCRIPTIONS).forEach(([type, desc]) => {
          console.log(`\n${type}: ${desc}`);
        });

        rl.question("\nSelect locale context type (file/deep): ", (answer) => {
          const type = answer.trim().toLowerCase();
          if (!Object.values(LOCALE_CONTEXT_TYPES).includes(type)) {
            console.log("❌ Please enter a valid context type");
            resolve("");
          } else {
            resolve(type);
          }
        });
      });
    }

    // Generate initial context structure
    if (config.source) {
      config.localeContext = await generateLocaleContext(
        config.source,
        config.localeContextType,
        config.fileTypes,
        rl
      );
    }

    const configJson = JSON.stringify(config, null, 2);
    fs.writeFileSync("localizer-ai.config.json", configJson);
    console.log(
      "\n✅ Config file created successfully: localizer-ai.config.json"
    );
  } catch (error) {
    console.error("\n❌ Error creating config file:", error.message);
  } finally {
    rl.close();
  }
}

/**
 * Parses command-line arguments and returns an options object.
 */
async function parseCommandLineArgs() {
  const args = process.argv.slice(2);

  displayWelcomeMessage();

  if (args.includes("--create-config")) {
    await createConfigFile();
    process.exit(0);
  }

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

/**
 * Replicates files in the source directory to target directories with translations.
 */
async function replicateFiles(
  sourcePath,
  locales,
  fileTypes,
  from,
  destinationPath
) {
  const spinner = createSpinner();
  const localeSuccess = new Map();

  async function processFile(sourceItemPath, targetItemPath, item) {
    let fileContent = fs.readFileSync(sourceItemPath, "utf8");
    const fileType = detectFileType(item);
    let fileContentToTranslate = fileContent;
    if (item.endsWith(".json")) {
      fileContentToTranslate = JSON.parse(fileContent);
    }

    const translationPromises = locales.map(async (locale) => {
      if (localeSuccess.has(locale)) return;

      const localeFilePath = path.join(
        destinationPath ? `${destinationPath}/${locale}` : locale,
        targetItemPath
      );

      try {
        if (item.endsWith(".json")) {
          const localeContextType = getLocaleContextType();
          let fileContext;
          if (localeContextType === LOCALE_CONTEXT_TYPES.FILE) {
            fileContext = getContext(targetItemPath);
          }
          await translateNestedJson({
            fileContent: fileContentToTranslate,
            to: locale,
            localeFilePath,
            from,
            contextFilePath: targetItemPath,
            fileContext,
          });
        } else {
          const localeContext = getContext(targetItemPath);
          const translatedData = await translateText({
            content: fileContentToTranslate,
            from,
            to: locale,
            localeContext,
            fileType,
          });
          fs.mkdirSync(path.dirname(localeFilePath), { recursive: true });
          fs.writeFileSync(localeFilePath, translatedData, "utf8");
        }

        localeSuccess.set(locale, true);
      } catch (error) {
        console.warn(
          `❌ Error translating file ${localeFilePath}: ${error.message}\n`
        );
        localeSuccess.set(locale, false);
      }
    });

    await Promise.all(translationPromises);
  }

  async function replicateFolder(sourceFolder, targetFolder) {
    const items = fs.readdirSync(sourceFolder);

    await Promise.all(
      items.map(async (item) => {
        const sourceItemPath = path.join(sourceFolder, item);
        const targetItemPath = path.join(targetFolder, item);
        const isDirectory = fs.statSync(sourceItemPath).isDirectory();

        if (isDirectory) {
          await replicateFolder(sourceItemPath, targetItemPath);
        } else if (fileTypes.some((fileType) => item.endsWith(fileType))) {
          await processFile(sourceItemPath, targetItemPath, item);
        }
      })
    );
  }
  console.log("Please wait while we translate your files...");
  spinner.start();
  await replicateFolder(sourcePath, "");

  locales.forEach((locale) => {
    spinner.setLocaleStatus(locale, localeSuccess.get(locale) ? "✅" : "❌");
  });
  spinner.stopAndPersist();
}

module.exports = { parseCommandLineArgs };
