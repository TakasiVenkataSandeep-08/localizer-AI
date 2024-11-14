let localeConfig;

/**
 * Creates a template for text formatting with preserved special patterns
 * @param {string} content - The content to be formatted
 * @param {string} [fileType="txt"] - The type of file being processed ("txt" or "md")
 * @returns {Object} An object containing:
 *   - template: The formatted template with placeholders
 *   - chunks: Array of extracted content chunks
 *   - reconstruct: Function to rebuild content from translated chunks
 */
const createFormatTemplate = (content, fileType = "txt") => {
  if (!content) return { template: "", chunks: [] };

  let chunks = [];
  let template = content;

  // Common patterns to preserve
  const preservePatterns = {
    // URLs, keeping them intact
    url: /(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
    // Variables/placeholders like {{var}} or {var}
    variables: /\{\{.*?\}\}|\{.*?\}/g,
    // HTML tags
    htmlTags: /<[^>]+>/g,
    // LaTeX-style formulas
    latex: /\$\$[\s\S]*?\$\$|\$[\s\S]*?\$/g,
  };

  const preserveSpecialPatterns = (text) => {
    const preserved = new Map();
    let processedText = text;

    // Preserve special patterns before chunking
    Object.entries(preservePatterns).forEach(([type, pattern]) => {
      processedText = processedText.replace(pattern, (match) => {
        const token = `__${type}_${preserved.size}__`;
        preserved.set(token, match);
        return token;
      });
    });

    return { processedText, preserved };
  };

  const restorePreservedPatterns = (text, preserved) => {
    let restoredText = text;
    preserved.forEach((value, token) => {
      restoredText = restoredText.replace(token, value);
    });
    return restoredText;
  };

  if (fileType === "txt") {
    // Preserve special patterns
    const { processedText, preserved } = preserveSpecialPatterns(content);

    // Split by paragraph breaks while preserving exact whitespace
    const paragraphs = processedText.split(/(?<=\n)(?:\s*\n)+/);

    chunks = paragraphs
      .map((p) => restorePreservedPatterns(p, preserved))
      .filter((chunk) => chunk.trim());

    // Create template maintaining exact original spacing
    template = chunks.map((_, index) => `$chunk-${index + 1}`).join("\n\n");
  } else if (fileType === "md") {
    // Markdown-specific patterns
    const mdPatterns = [
      // Headers with content
      {
        pattern: /^(#{1,6}\s+[^\n]+)(?:\n(?!#{1,6}\s|$)[^\n]+)*/gm,
        type: "header",
      },
      // Fenced code blocks with language
      {
        pattern: /```[\s\S]*?```/gm,
        type: "code",
      },
      // Lists with nested items
      {
        pattern:
          /^(?:[\s]*(?:[-*+]|\d+\.)\s+[^\n]+(?:\n(?!^|\n|#{1,6}\s|```|>)(?:[\s]*(?:[-*+]|\d+\.)\s+[^\n]+|\s+[^\n]+))*)$/gm,
        type: "list",
      },
      // Blockquotes with nested quotes
      {
        pattern:
          /^(?:>[\s]*[^\n]*(?:\n(?!^|\n|#{1,6}\s|```|[-*+]|\d+\.)>[\s]*[^\n]*)*)$/gm,
        type: "quote",
      },
      // Tables
      {
        pattern: /^\|[^\n]*\|(?:\n\|[-:\s]*\|)+(?:\n\|[^\n]*\|)+$/gm,
        type: "table",
      },
      // Regular paragraphs
      {
        pattern:
          /^(?!\s*(?:#{1,6}\s|[-*+]|\d+\.|>|\s*```|\|))(?:[^\n]+(?:\n(?!\s*(?:#{1,6}\s|[-*+]|\d+\.|>|\s*```|\|))[^\n]+)*)/gm,
        type: "paragraph",
      },
    ];

    // Preserve special patterns first
    const { processedText, preserved } = preserveSpecialPatterns(content);
    let remainingContent = processedText;
    let lastIndex = 0;
    const matches = [];

    // Find all matches while preserving their original position
    mdPatterns.forEach(({ pattern, type }) => {
      let match;
      while ((match = pattern.exec(remainingContent)) !== null) {
        matches.push({
          text: match[0],
          index: match.index + lastIndex,
          length: match[0].length,
          type,
        });
      }
    });

    // Sort matches by their position in the original text
    matches.sort((a, b) => a.index - b.index);

    // Process matches into chunks while maintaining original structure
    let currentIndex = 0;
    matches.forEach((match) => {
      const chunk = restorePreservedPatterns(match.text, preserved).trim();
      if (chunk) {
        currentIndex++;
        chunks.push(chunk);
        template = template.replace(match.text, `$chunk-${currentIndex}`);
      }
    });
  }

  return {
    template,
    chunks,
    // Helper method for reconstruction
    reconstruct: (translatedChunks) => {
      let result = template;
      translatedChunks.forEach((chunk, index) => {
        result = result.replace(`$chunk-${index + 1}`, chunk);
      });
      return result;
    },
  };
};

/**
 * Retrieves locale context from configuration
 * @param {string} pathToContext - Path to the context in the locale configuration
 * @returns {string} The locale context string or empty string if not found
 */
const getContext = (pathToContext) => {
  if (!localeConfig) {
    localeConfig = require("../../localizer-ai.config.json");
  }
  const localeContext = localeConfig.localeContext;
  return localeContext[pathToContext] || "";
};

const getValueFromConfig = (path) => {
  if (!localeConfig) {
    localeConfig = require("../../localizer-ai.config.json");
  }
  return localeConfig[path];
};

/**
 * Gets the locale context type from configuration
 * @returns {string} The locale context type
 */
const getLocaleContextType = () => {
  if (!localeConfig) {
    localeConfig = require("../../localizer-ai.config.json");
  }
  return localeConfig.localeContextType;
};

/**
 * Detects file type from file path
 * @param {string} filePath - Path to the file
 * @returns {string} The detected file type or "txt" as fallback
 */
const detectFileType = (filePath) => {
  const extension = filePath.split(".").pop().toLowerCase();
  return extension || "txt";
};

/**
 * Cleans and normalizes translated text while preserving original formatting
 * @param {string} translatedText - The raw translated text
 * @param {string} originalText - The original text before translation
 * @param {string} [fileType="txt"] - The type of file being processed ("txt" or "md")
 * @returns {string} The cleaned and normalized translated text
 */
const translateCleaner = (translatedText, originalText, fileType = "txt") => {
  if (!translatedText) return originalText;

  let cleaned = translatedText;

  // Remove triple quotes and other quote variations at start/end
  cleaned = cleaned
    // Remove triple quotes
    .replace(/^"""\s*|\s*"""$/g, "")
    // Remove other quote variations
    .replace(/^['"""'']+|['"""'']+$/g, "")
    // Remove any spaces that might be left at the start/end
    .trim();

  // Common cleaning for both formats
  cleaned = cleaned
    // Remove AI's explanatory notes
    .replace(/\[(Note|Translation|Translator's note):?\s*[^\]]*\]/gi, "")
    .replace(/\((Note|Translation|Translator's note):?\s*[^)]*\)/gi, "")
    // Remove line numbers or reference markers
    .replace(/^\s*\d+\.\s*|^\s*\[[\d*]\]\s*/gm, "")
    // Normalize spaces (but preserve markdown indentation)
    .replace(/([^\s>])\s+([^\s])/g, "$1 $2")
    // Fix common punctuation issues
    .replace(/\s+([.,!?;:])/g, "$1")
    // Preserve original URLs
    .replace(/https?:\/\/\S+/g, (match) => {
      const urlMatch = originalText.match(/https?:\/\/\S+/);
      return urlMatch ? urlMatch[0] : match;
    });

  if (fileType === "md") {
    // Preserve markdown specific elements
    const mdElements = [
      // Headers
      /^(#{1,6}\s+)/gm,
      // Code blocks with language
      /```[\s\S]*?```/g,
      // Inline code
      /`[^`]+`/g,
      // Links and images
      /!?\[([^\]]*)\]\([^)]+\)/g,
      // Bold/italic markers
      /(\*\*|__)[^*_]+(\*\*|__)/g,
      /(\*|_)[^*_]+(\*|_)/g,
      // Task lists
      /^(\s*[-*+]\s+\[[ x]\])/gm,
      // HTML tags
      /<[^>]+>/g,
      // Variables/placeholders
      /\{\{[^}]+\}\}/g,
      /\{[^}]+\}/g,
    ];

    mdElements.forEach((pattern) => {
      cleaned = cleaned.replace(pattern, (match) => {
        const originalMatch = originalText.match(pattern);
        if (originalMatch && originalMatch[0].length === match.length) {
          return originalMatch[0];
        }
        // If no exact match found, preserve the structure but keep translated content
        if (pattern.source.includes("^(#{1,6}\\s+)")) {
          // For headers, keep the heading level but allow translated text
          const headerMatch = match.match(/^(#{1,6}\s+)/);
          return headerMatch
            ? headerMatch[0] + match.slice(headerMatch[0].length)
            : match;
        }
        return match;
      });
    });

    // Fix list formatting
    cleaned = cleaned
      // Normalize list markers
      .replace(/^(\s*)[-•●○*+]\s+/gm, "$1- ")
      // Fix numbered lists
      .replace(/^(\s*)\d+\.\s+/gm, "$11. ")
      // Preserve list indentation
      .replace(/^(\s*[-*+\d.])\s*([^\n]+)/gm, "$1 $2");
  } else {
    // txt
    cleaned = cleaned
      // Remove any markdown-like formatting
      .replace(/[*_~`#]+(.*?)[*_~`#]+/g, "$1")
      // Normalize quotes
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      // Preserve paragraph breaks but remove excessive ones
      .replace(/\n\s*\n/g, "\n\n")
      .replace(/\n{3,}/g, "\n\n")
      // Preserve original indentation
      .replace(/^(.+)$/gm, (match) => {
        const indentMatch = originalText.match(/^(\s+)/m);
        return indentMatch ? indentMatch[1] + match.trim() : match;
      });
  }

  // Final common cleaning
  cleaned = cleaned
    // Remove any remaining AI artifacts
    .replace(/^Translation:\s*/i, "")
    .replace(/^Translated text:\s*/i, "")
    // Remove any remaining quotes at start/end of lines
    .replace(/^["']+|["']+$/gm, "")
    // Normalize whitespace at start/end
    .trim()
    // Ensure consistent line endings
    .replace(/\r\n/g, "\n");

  return cleaned;
};

module.exports = {
  getContext,
  getLocaleContextType,
  detectFileType,
  createFormatTemplate,
  translateCleaner,
  getValueFromConfig,
};
