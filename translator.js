#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { translate } = require("free-translate");

const args = process.argv.slice(2);
const options = { source: "", fileType: "", locales: [] };
console.log(
  "Welcome to content-localizer. Explore more at https://www.npmjs.com/package/content-localizer"
);
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--source" && i < args.length - 1) {
    options.source = args[i + 1];
  } else if (args[i] === "--fileType" && i < args.length - 1) {
    options.fileType = args[i + 1];
  } else if (args[i] === "--locales" && i < args.length - 1) {
    const localesString = args[i + 1];
    if (!!localesString) {
      options.locales = localesString.split(",").map((locale) => locale.trim());
    }
  }
}

if (!options.source || !options.fileType || !options.locales.length) {
  console.error(
    "All --source and --fileType and --locales options are required."
  );
  process.exit(1);
}

// Check if the source directory exists
if (
  !fs.existsSync(options.source) ||
  !fs.statSync(options.source).isDirectory()
) {
  console.error(
    `Error: The specified source directory '${options.source}' does not exist.`
  );
  process.exit(1);
}

function replicateFiles(sourcePath, locales, fileType) {
  console.log("Please wait while we work our magic...");
  async function replicateFolder(sourceFolder, targetFolder) {
    await Promise.all(
      fs.readdirSync(sourceFolder).map(async (item) => {
        const sourceItemPath = path.join(sourceFolder, item);
        const targetItemPath = path.join(targetFolder, item);
        if (fs.statSync(sourceItemPath).isDirectory()) {
          // If the item is a directory, replicate it and its contents
          replicateFolder(sourceItemPath, targetItemPath);
        } else if (item.endsWith(fileType)) {
          // If the item is a file of the specified type, read it
          const fileContent = fs.readFileSync(sourceItemPath, "utf8");
          await Promise.all(
            locales.map(async (locale) => {
              const localeFilePath = path.join(locale, targetItemPath);
              fs.mkdirSync(path.dirname(localeFilePath), { recursive: true });
              try {
                const translatedData = await translate(`${fileContent}`, {
                  from: "en",
                  to: locale,
                });
                fs.writeFileSync(localeFilePath, translatedData, "utf8");
              } catch (error) {
                console.log(error);
              }
            })
          );
        }
      })
    );
    console.error("Translations done 🚀");
    process.exit();
  }
  replicateFolder(sourcePath, "");
}

replicateFiles(options.source, options.locales, options.fileType);
