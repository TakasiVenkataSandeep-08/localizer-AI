const fs = require("fs");
const path = require("path");
const { createSpinner } = require("./spinner.js");
const { translateText } = require("./textTranslator.js");
const { translateNestedJson } = require("./jsonTranslator.js");
const {
  getContext,
  getLocaleContextType,
  detectFileType,
} = require("./common.js");
const { LOCALE_CONTEXT_TYPES } = require("../constants/config.js");

/**
 * Replicates files in the source directory to target directories with translations.
 * @param {string} sourcePath - The path to the source directory containing files to translate
 * @param {string[]} locales - Array of locale codes to translate into (e.g., ['es', 'fr'])
 * @param {string[]} fileTypes - Array of file extensions to process (e.g., ['.json', '.txt'])
 * @param {string} from - Source language code
 * @param {string} [destinationPath] - Optional custom destination path for translated files
 * @returns {Promise<void>}
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

  /**
   * Processes and translates an individual file
   * @param {string} sourceItemPath - Path to the source file
   * @param {string} targetItemPath - Relative path for the target file
   * @param {string} item - Filename with extension
   * @returns {Promise<void>}
   */
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

  /**
   * Recursively replicates folder structure and processes files
   * @param {string} sourceFolder - Path to the source folder
   * @param {string} targetFolder - Relative path for the target folder
   * @returns {Promise<void>}
   */
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

module.exports = { replicateFiles };
