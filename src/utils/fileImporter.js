const path = require("path");
const fs = require("fs");

/**
 * Imports content from JS/TS files
 * @param {string} filePath - Absolute path to the file
 * @returns {Promise<Object|null>} Imported content or null
 */
async function importJsOrTsFile(filePath) {
  if (!filePath) throw new Error("File path is required");

  try {
    const resolvedPath = path.resolve(process.cwd(), filePath);

    // Read file content
    const content = fs.readFileSync(resolvedPath, "utf8");

    // Remove comments and whitespace to optimize regex processing
    const cleanContent = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "").trim();

    // Match exports pattern
    const exportMatch = cleanContent.match(
      /(?:module\.exports\s*=\s*({[\s\S]*})|export\s+default\s+({[\s\S]*})|export\s+const\s+(\w+)\s*=\s*({[\s\S]*}))/
    );

    if (!exportMatch) {
      throw new Error("No valid exports found in file");
    }

    // Get the exported content
    const exportedContent = exportMatch[1] || exportMatch[2] || exportMatch[4];

    // Safely evaluate the content
    const result = eval(`(${exportedContent})`);
    return result || null;
  } catch (error) {
    console.error(`Import failed: ${error.message}`);
    return null;
  }
}

module.exports = { importJsOrTsFile };
