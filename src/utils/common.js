const path = require("path");

let localeConfig;

const getConfig = () => {
  if (!localeConfig) {
    localeConfig = require(path.join(process.cwd(), "localizer-ai.config.json"));
  }
  return localeConfig;
};

const getValueFromConfig = (path) => {
  const localeConfig = getConfig();
  return localeConfig[path];
};

/**
 * Gets the locale context type from configuration
 * @returns {string} The locale context type
 */
const getLocaleContextType = () => {
  const localeConfig = getConfig();
  return localeConfig.localeContextType;
};

const mdPatterns = [
  {
    type: "header",
    pattern: /^(#{1,6}\s+[^\n]+)$/gm,
    getFormat: (match) => ({
      headerLevel: (match.match(/^(#+)/)[0] || "").length,
      spacing: match.match(/^#+(\s+)/)[1],
      originalIndent: match.match(/^(\s*)/)[0],
    }),
  },
  {
    type: "list",
    pattern:
      /^(?:\s*(?:[-*+]|\d+\.)\s+(?:[^\n]+)(?:\n(?!\s*(?:[-*+]|\d+\.)\s|#|```|:::|\|)[^\n]+)*)+$/gm,
    getFormat: (match) => {
      const lines = match.split("\n");
      let levelCounters = {};
      let parentCounters = {};

      return {
        indentation: lines.map((line) => line.match(/^(\s*)/)[0].length),
        markers: lines.map((line, index) => {
          const indent = line.match(/^(\s*)/)[0].length;
          const level = Math.floor(indent / 2);
          const marker = line.match(/^[\s]*([-*+]|\d+\.)/)?.[1];
          const isNumbered = marker?.includes(".");

          // Reset counter for new level
          if (!levelCounters[level]) {
            levelCounters[level] = 1;
            // Store parent level counter
            if (level > 0) {
              const parentLevel = level - 1;
              parentCounters[level] = levelCounters[parentLevel];
            }
          }

          if (isNumbered) {
            const num = levelCounters[level]++;
            return `${num}.`;
          }

          return marker?.replace(/^-+/, "-") || "-";
        }),
        originalStructure: lines.map((line, index) => {
          const indent = line.match(/^(\s*)/)[0];
          const level = Math.floor(indent.length / 2);
          const marker = line.match(/^[\s]*([-*+]|\d+\.)/)?.[1];
          const isNumbered = marker?.includes(".");

          return {
            indent,
            marker,
            content: line.replace(/^[\s]*([-*+]|\d+\.)\s+/, ""),
            level,
            isNumbered,
            parentLevel: level > 0 ? level - 1 : null,
          };
        }),
      };
    },
  },
  {
    type: "mermaid",
    pattern:
      /^(?:```mermaid\n[\s\S]*?```|mermaid\n[\s\S]*?)(?=\n(?:\s*\n|#|```|$))/gm,
    getFormat: (match) => ({
      indent: match.match(/^(\s*)/)[0],
      isFenced: match.startsWith("```"),
      content: match.replace(/^(?:```mermaid\n|mermaid\n)|```$/g, "").trim(),
      originalStructure: match.split("\n").map((line) => ({
        indent: line.match(/^(\s*)/)[0],
        content: line.trim(),
      })),
    }),
  },
  {
    type: "container",
    pattern: /^:::(\w+)\n([\s\S]*?)(?:\n)?:::$/gm,
    getFormat: (match) => ({
      type: match.match(/^:::(\w+)/)[1],
      indent: match.match(/^(\s*)/)[0],
      content: match.match(/^:::\w+\n([\s\S]*?)(?:\n)?:::$/)[1],
      originalStructure: match.split("\n").map((line) => ({
        indent: line.match(/^(\s*)/)[0],
        isWrapper: line.match(/^:::/) !== null,
      })),
    }),
  },
  {
    type: "definition",
    pattern: /^([^\n:]+)(?:\n:\s*:[^\n]+)+$/gm,
    getFormat: (match) => ({
      term: match.match(/^[^\n:]+/)[0].trim(),
      definitions: match
        .match(/(?:\n:\s*:[^\n]+)/g)
        .map((def) => def.replace(/^:\s*:/, "")),
      originalStructure: match.split("\n").map((line) => ({
        indent: line.match(/^(\s*)/)[0],
        isDef: line.startsWith(":"),
        content: line.trim().replace(/^:\s*:/, ""),
      })),
    }),
  },
  {
    type: "code",
    pattern: /```[\s\S]*?```/gm,
    getFormat: (match) => ({
      language: match.match(/^```(\w*)/m)?.[1] || "",
      indent: match.match(/^(\s*)/)[0],
      preserveNewlines: true,
      content: match.replace(/^```\w*\n|```$/g, "").trim(),
      originalStructure: match.split("\n").map((line) => ({
        indent: line.match(/^(\s*)/)[0],
      })),
    }),
  },
  {
    type: "quote",
    pattern:
      /^(?:>[\s]*[^\n]*(?:\n(?!^|\n|#{1,6}\s|```|[-*+]|\d+\.)>[\s]*[^\n]*)*)$/gm,
    getFormat: (match) => ({
      indentation: match.match(/^(\s*>[\s]*)/gm).map((space) => space.length),
      quoteDepth: match.match(/^(>+)/)[0].length,
      originalStructure: match.split("\n").map((line) => ({
        indent: line.match(/^(\s*)/)[0],
        quoteMarkers: line.match(/^(\s*>+\s*)/)[0],
      })),
    }),
  },
  {
    type: "table",
    pattern: /^\|.*\|$[\s\S]*?(?=\n\s*\n|\n(?:#{1,6}\s|```|<|\[|$))/gm,
    getFormat: (match) => {
      const rows = match.split("\n");
      return {
        isTable: true,
        rows: rows.map((row) => ({
          content: row,
          isSeparator: /^\s*\|[-:\s|]+\|\s*$/.test(row),
          cells: row
            .split("|")
            .filter((cell, i) => i > 0 && i < row.split("|").length - 1)
            .map((cell) => ({
              text: cell.trim(),
              leftPad: cell.match(/^\s*/)[0],
              rightPad: cell.match(/\s*$/)[0],
            })),
        })),
      };
    },
  },
  {
    type: "paragraph",
    pattern:
      /^(?!\s*(?:#{1,6}\s|[-*+]|\d+\.|>|\s*```|\|))(?:[^\n]+(?:\n(?!\s*(?:#{1,6}\s|[-*+]|\d+\.|>|\s*```|\|))[^\n]+)*)/gm,
    getFormat: (match) => ({
      indentation: match.match(/^(\s*)/gm).map((space) => space.length),
      originalStructure: match.split("\n").map((line) => ({
        indent: line.match(/^(\s*)/)[0],
      })),
    }),
  },
  {
    type: "math",
    pattern: /(?:\$\$[\s\S]*?\$\$|\$[^\n$]*\$)/gm,
    getFormat: (match) => ({
      isInline: !match.startsWith("$$"),
      originalContent: match,
      spacing: {
        before: match.match(/^\s*/)[0],
        after: match.match(/\s*$/)[0],
      },
      preserveNewlines: !match.startsWith("$") || match.includes("\n"),
    }),
  },
  {
    type: "taskList",
    pattern:
      /^(\s*)[-*+]\s+\[([ x])\].*(?:\n(?!\s*[-*+]\s+\[[x ]\]|\s*\n|#).*)*$/gm,
    getFormat: (match) => ({
      indentation: match.match(/^(\s*)/gm).map((space) => space.length),
      checked: match.match(/\[[x ]\]/gi).map((box) => box.includes("x")),
      originalStructure: match.split("\n").map((line) => ({
        indent: line.match(/^(\s*)/)[0],
        checkbox: line.match(/\[([ x])\]/)?.[0] || "",
      })),
    }),
  },
  {
    type: "footnote",
    pattern: /^\[\^[^\]]+\]:(?:\s.*(?:\n(?!\[\^|\s*\n|#).*)*)/gm,
    getFormat: (match) => ({
      id: match.match(/^\[\^([^\]]+)\]/)[1],
      indentation: match.match(/^(\s*)/gm).map((space) => space.length),
      originalStructure: match.split("\n").map((line) => ({
        indent: line.match(/^(\s*)/)[0],
      })),
    }),
  },
  {
    type: "html",
    pattern: /<(\w+)(?:\s+[^>]*)?>[^<]*<\/\1>|<\w+(?:\s+[^>]*)?\/>/gm,
    getFormat: (match) => ({
      tag: match.match(/<(\w+)/)[1],
      attributes: (match.match(/\s+[^>]*/)?.[0] || "").trim(),
      isSelfClosing: match.endsWith("/>"),
      originalContent: match,
    }),
  },
  {
    type: "details",
    pattern: /<details>[\s\S]*?<\/details>/gm,
    getFormat: (match) => ({
      isDetails: true,
      summary: match.match(/<summary>(.*?)<\/summary>/)?.[1] || "",
      content: match.replace(/<\/?details>|<\/?summary>.*?\n/g, "").trim(),
      originalStructure: match.split("\n").map((line) => ({
        indent: line.match(/^(\s*)/)[0],
        isTag: /<\/?[^>]+>/.test(line),
        isList: line.trim().startsWith("- "),
        content: line.trim(),
      })),
    }),
  },
];

const createFormatTemplate = (content, fileType = "txt") => {
  if (!content) return { template: "", chunks: [] };

  let chunks = [];
  let chunkFormats = [];
  let template = content;
  let matches = [];

  if (fileType === "txt") {
    const paragraphs = content.split(/(?<=\n)(?:\s*\n)+/);
    let lastWasEmpty = false;

    paragraphs.forEach((p, index) => {
      if (p.trim() || lastWasEmpty) {
        chunkFormats.push({
          leadingSpaces: index === 0 ? "" : p.match(/^\s*/)[0],
          trailingSpaces: p.match(/\s*$/)[0],
          indentation: p.match(/^(\s*)/gm).map((space) => space.length),
          isEmptyLine: !p.trim(),
        });
        chunks.push(p.trim() || "\n");
        lastWasEmpty = !p.trim();
      }
    });

    template = chunks.map((_, index) => `$chunk-${index + 1}`).join("\n");
  } else if (fileType === "md") {
    let remainingContent = content;

    for (const { pattern, type, getFormat } of mdPatterns) {
      let match;
      while ((match = pattern.exec(remainingContent)) !== null) {
        if (match[0].trim()) {
          matches.push({
            text: match[0],
            index: match.index,
            type,
            format: getFormat(match[0]),
          });
        }
      }
    }

    matches.sort((a, b) => a.index - b.index);

    matches.forEach((match, index) => {
      if (match.text.trim()) {
        chunks.push(match.text.trim());
        chunkFormats.push(match.format);
        template = template.replace(match.text, `$chunk-${index + 1}`);
      }
    });
  }

  return {
    template,
    chunks,
    reconstruct: (translatedChunks) => {
      let result = template;
      translatedChunks.forEach((chunk, index) => {
        const format = chunkFormats[index];
        let formattedChunk = chunk;

        if (fileType === "txt") {
          if (format.isEmptyLine) {
            formattedChunk = "\n";
          } else {
            formattedChunk =
              format.leadingSpaces +
              chunk
                .split("\n")
                .map(
                  (line, i) =>
                    " ".repeat(format.indentation[i] || 0) + line.trim()
                )
                .join("\n") +
              format.trailingSpaces;
          }
        } else if (fileType === "md") {
          const matchType = matches[index].type;
          formattedChunk = formatMarkdownChunk(chunk, matchType, format);
        }

        result = result.replace(`$chunk-${index + 1}`, formattedChunk);
      });
      return result;
    },
  };
};

const formatMarkdownChunk = (chunk, type, format) => {
  switch (type) {
    case "header":
      return (
        format.originalIndent +
        "#".repeat(format.headerLevel) +
        format.spacing +
        chunk.replace(/^#+\s*/, "").trim()
      );

    case "list":
      let levelCounters = {};
      let parentCounters = {};

      return chunk
        .split("\n")
        .map((line, i) => {
          const struct = format.originalStructure[i];
          const level = struct.level;
          const indent = "  ".repeat(level);

          // Reset counter for new level
          if (!levelCounters[level]) {
            levelCounters[level] = 1;
            if (level > 0) {
              parentCounters[level] = levelCounters[level - 1];
            }
          }

          let marker;
          if (struct.isNumbered) {
            marker = `${levelCounters[level]}.`;
            levelCounters[level]++;
          } else {
            marker = "-";
          }

          const content = line.trim().replace(/^[-*+\d.]+\s+/, "");
          return `${indent}${marker} ${content}`;
        })
        .join("\n");

    case "code":
      const codeContent =
        format.content || chunk.replace(/^```\w*\n|```$/g, "").trim();
      return [
        `${format.indent}\`\`\`${format.language}`,
        ...codeContent
          .split("\n")
          .map((line) => `${format.indent}${line.trim()}`),
        `${format.indent}\`\`\``,
      ].join("\n");

    case "quote":
      return chunk
        .split("\n")
        .map((line, i) => {
          const originalStructure =
            format.originalStructure[i] || format.originalStructure[0];
          return `${originalStructure.indent}${originalStructure.quoteMarkers}${line.replace(/^>\s*/, "").trim()}`;
        })
        .join("\n");

    case "table":
      return formatTable(chunk, format);

    case "mermaid":
      const mermaidContent = chunk.replace(/^mermaid\n/gm, "").trim();
      return [
        `${format.indent}\`\`\`mermaid`,
        ...mermaidContent
          .split("\n")
          .map((line) => `${format.indent}${line.trim()}`),
        `${format.indent}\`\`\``,
      ].join("\n");

    case "math":
      const mathContent = chunk.replace(/^\$+|\$+$/g, "").trim();
      if (format.isInline) {
        return `${format.spacing.before}$${mathContent}$${format.spacing.after}`;
      }
      return format.preserveNewlines
        ? `$$\n${mathContent}\n$$`
        : `$$${mathContent}$$`;

    case "container":
      const containerContent = chunk.replace(/^:::.*\n|:::$/gm, "").trim();
      return [
        `${format.indent}:::${format.type}`,
        ...containerContent
          .split("\n")
          .map((line) => `${format.indent}${line.trim()}`),
        `${format.indent}:::`,
      ].join("\n");

    case "definition":
      const formattedDefinitions = format.definitions.map((def) => {
        const cleanDef = def.replace(/^:+\s*/, "").trim();
        return `: ${cleanDef}`;
      });

      return [format.term, ...formattedDefinitions].join("\n");

    case "taskList":
      return chunk
        .split("\n")
        .map((line, i) => {
          const originalStructure =
            format.originalStructure[i] || format.originalStructure[0];
          const checkbox = format.checked[i] ? "[x]" : "[ ]";
          return `${originalStructure.indent}- ${checkbox} ${line.replace(/^[-*+]\s+\[[x ]\]\s*/, "")}`;
        })
        .join("\n");

    case "footnote":
      return chunk
        .split("\n")
        .map((line, i) => {
          const originalIndent = format.originalStructure[i]?.indent || "";
          return i === 0
            ? `${originalIndent}[^${format.id}]: ${line.replace(/^\[\^[^\]]+\]:\s*/, "")}`
            : `${originalIndent}${line.trim()}`;
        })
        .join("\n");

    case "html":
      if (format.isSelfClosing) {
        return format.originalContent;
      }
      const content = chunk.replace(/^<\w+[^>]*>|<\/\w+>$/g, "");
      return `<${format.tag}${format.attributes ? " " + format.attributes : ""}>${content}</${format.tag}>`;

    case "details": {
      const formattedContent = format.content
        .split("\n")
        .map((line) => {
          if (line.trim().startsWith("- ")) {
            return line.replace(/^(\s*)[-]+\s+/, "$1- ");
          }
          return line;
        })
        .join("\n");

      return [
        "<details>",
        `<summary>${format.summary}</summary>`,
        formattedContent,
        "</details>",
      ].join("\n");
    }

    default:
      return chunk;
  }
};

const formatTable = (content, format) => {
  if (!format.isTable) return content;

  // Calculate maximum width for each column based on translated content
  const rows = content.split("\n");
  const columnWidths = format.rows.reduce((widths, rowFormat, rowIndex) => {
    const translatedCells =
      rows[rowIndex]
        ?.split("|")
        .filter((_, i) => i > 0 && i < rows[rowIndex].split("|").length - 1) ||
      [];
    rowFormat.cells.forEach((cell, i) => {
      const translatedContent = translatedCells[i]?.trim() || cell.text;
      widths[i] = Math.max(widths[i] || 0, translatedContent.length);
    });
    return widths;
  }, []);

  return format.rows
    .map((rowFormat, rowIndex) => {
      if (rowFormat.isSeparator) {
        // Format separator row with consistent width and alignment markers
        return (
          "|" +
          rowFormat.cells
            .map((_, i) => {
              const width = columnWidths[i];
              const alignment = rowFormat.cells[i].text;
              const dashes = "-".repeat(width);

              if (alignment.includes(":") && alignment.endsWith(":")) {
                return `:${dashes}:`; // center
              } else if (alignment.endsWith(":")) {
                return `${dashes}:`; // right
              }
              return `-${dashes}-`; // left
            })
            .join("|") +
          "|"
        );
      }

      // Format content rows with proper alignment and consistent spacing
      const translatedCells =
        rows[rowIndex]
          ?.split("|")
          .filter(
            (_, i) => i > 0 && i < rows[rowIndex].split("|").length - 1
          ) || [];

      return (
        "|" +
        rowFormat.cells
          .map((cell, i) => {
            const width = columnWidths[i];
            const translatedContent = translatedCells[i]?.trim() || cell.text;
            const alignment = format.rows[1]?.cells[i]?.text || "";

            if (alignment.includes(":") && alignment.endsWith(":")) {
              // Center alignment
              const totalSpace = width - translatedContent.length;
              const leftSpace = Math.floor(totalSpace / 2);
              const rightSpace = totalSpace - leftSpace;
              return ` ${" ".repeat(leftSpace)}${translatedContent}${" ".repeat(rightSpace)} `;
            } else if (alignment.endsWith(":")) {
              // Right alignment
              return ` ${" ".repeat(width - translatedContent.length)}${translatedContent} `;
            }
            // Left alignment (default)
            return ` ${translatedContent}${" ".repeat(width - translatedContent.length)} `;
          })
          .join("|") +
        "|"
      );
    })
    .join("\n");
};

const translateCleaner = (translatedText, originalText, fileType = "md") => {
  if (!translatedText) return originalText;

  let cleaned = translatedText;

  // Fix list formatting issues
  cleaned = cleaned
    // Fix nested list markers
    .replace(/^(\s*)(?:-\s*-|\d+\.\s*-)\s+/gm, (match, indent) => `${indent}- `)
    // Fix numbered list continuity
    .replace(/^(\s*)(\d+)\.\s+/gm, (match, indent, num) => {
      const level = Math.floor(indent.length / 2);
      return `${indent}${num}. `;
    })
    // Standardize list markers
    .replace(/^(\s*)[-*+]\s+(?=\S)/gm, (match, indent) => `${indent}- `)
    // Remove translation artifacts
    .replace(/^\s*["""''`]{3}\s*|\s*["""''`]{3}\s*$/gm, "")
    .replace(/^[\s>]*["""''`]{3}\s*/gm, "")
    .replace(/\s*["""''`]{3}\s*$/gm, "")
    .replace(/\[(Note|Translation|Translator's note):?\s*[^\]]*\]/gi, "")
    .replace(/\((Note|Translation|Translator's note):?\s*[^)]*\)/gi, "")
    .replace(/^Translation:\s*/gim, "")
    // Fix undefined markers
    .replace(/^undefined\.\s+/gm, "- ");

  return cleaned.trim();
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
 * Retrieves locale context from configuration
 * @param {string} pathToContext - Path to the context in the locale configuration
 * @returns {string} The locale context string or empty string if not found
 */
const getContext = (pathToContext) => {
  const localeConfig = getConfig();
  const localeContext = localeConfig.localeContext;
  return localeContext[pathToContext] || "";
};

const validateListStructure = (lines) => {
  const stack = [];
  let lastLevel = 0;

  return lines.map((line, index) => {
    const indent = line.match(/^(\s*)/)[0].length;
    const level = Math.floor(indent / 2);
    const marker = line.match(/^[\s]*([-*+]|\d+\.)/)?.[1];

    // Validate level jumps
    if (level > lastLevel + 1) {
      // Fix incorrect indentation
      return {
        ...line,
        indent: "  ".repeat(lastLevel + 1),
        level: lastLevel + 1,
      };
    }

    // Update stack
    while (stack.length > level) {
      stack.pop();
    }
    stack[level] = (stack[level] || 0) + 1;
    lastLevel = level;

    return line;
  });
};

module.exports = {
  getContext,
  getValueFromConfig,
  getLocaleContextType,
  createFormatTemplate,
  formatMarkdownChunk,
  translateCleaner,
  detectFileType,
};
