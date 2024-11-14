const fs = require("fs");
const path = require("path");
const readline = require("readline");
const {
  LOCALE_CONTEXT_TYPES,
  LOCALE_CONTEXT_DESCRIPTIONS,
} = require("../constants/config.js");

/**
 * Creates a readline interface for handling user input and output
 * @returns {readline.Interface} A readline interface configured with standard input/output
 */
function createPrompt() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * Generates a locale context structure based on the source directory contents
 * @param {string} sourcePath - The path to the source directory to process
 * @param {string} contextType - The type of context to generate ('file' or 'deep')
 * @param {string[]} fileTypes - Array of file extensions to process (e.g., ['.txt', '.md'])
 * @returns {Promise<Object>} A promise that resolves to the generated context object
 */
async function generateLocaleContext(sourcePath, contextType, fileTypes) {
  const context = {};

  async function processFolder(folderPath, contextObj) {
    const items = fs.readdirSync(folderPath);

    for (const item of items) {
      const itemPath = path.join(folderPath, item);
      const isDirectory = fs.statSync(itemPath).isDirectory();
      const relativeItemPath = path
        .relative(sourcePath, itemPath)
        .replace(/\\/g, "/");

      if (isDirectory) {
        await processFolder(itemPath, contextObj);
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
              const nestedContext = await generateDeepContext(fileContent);
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

/**
 * Recursively processes a JSON object to generate a deep context structure
 * @param {Object} jsonContent - The JSON object to process
 * @returns {Promise<Object>} A promise that resolves to an object containing flattened key paths
 * @example
 *  Input: { "menu": { "item": "value" } }
 *  Output: { "menu.item": "" }
 */
async function generateDeepContext(jsonContent) {
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
 * Handles the interactive creation of the localizer configuration file
 * Prompts the user for various settings and generates a config file
 * @returns {Promise<void>}
 * @throws {Error} If there are issues creating the config file or processing user input
 *
 * @example Configuration file structure:
 * {
 *   source: string,        // Source directory path
 *   fileTypes: string[],   // Array of file extensions to process
 *   locales: string[],     // Target locale codes
 *   from: string,          // Source language code
 *   destination: string,   // Output directory path
 *   localeContextType: string, // Context generation type ('file' or 'deep')
 *   localeContext: Object  // Generated context structure
 * }
 */
async function handleCreateConfigFile() {
  const rl = createPrompt();
  const config = {
    source: "",
    fileTypes: [],
    locales: [],
    from: "",
    destination: "",
    localeContextType: "",
    localeContext: {},
    aiServiceProvider: "openAI",
    llmConfig: {},
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
          "Enter file types to translate (comma-separated, e.g., .json,.txt,.md): ",
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

    // Add AI service provider selection
    config.aiServiceProvider = await new Promise((resolve) => {
      rl.question(
        "\nSelect AI service provider (openAI/mistralAI) [default: openAI]: ",
        (answer) => {
          const provider = answer.trim().toLowerCase();
          if (!provider) {
            resolve("openAI");
          } else if (provider !== "openai" && provider !== "mistralai") {
            console.log("❌ Invalid provider. Using default: openAI");
            resolve("openAI");
          } else {
            resolve(provider === "openai" ? "openAI" : "mistralAI");
          }
        }
      );
    });

    // Generate initial context structure
    if (config.source) {
      config.localeContext = await generateLocaleContext(
        config.source,
        config.localeContextType,
        config.fileTypes
      );
    }

    const configJson = JSON.stringify(config, null, 2);
    fs.writeFileSync("localizer-ai.config.json", configJson);
    console.log(
      "\n✅ Config file created successfully: localizer-ai.config.json"
    );
    console.log(
      "\n💡 You can now edit the llmConfig section in the config file to customize the LLM settings.\n Make sure to save the config file before running the translate command."
    );
  } catch (error) {
    console.error("\n❌ Error creating config file:", error.message);
  } finally {
    rl.close();
  }
}

module.exports = { handleCreateConfigFile };
