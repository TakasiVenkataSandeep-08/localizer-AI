const LOCALE_CONTEXT_TYPES = {
  // FOLDER: "folder",
  FILE: "file",
  DEEP: "deep",
};

const LOCALE_CONTEXT_DESCRIPTIONS = {
  [LOCALE_CONTEXT_TYPES.FILE]:
    "File-level context: Allows setting context for individual files",
  [LOCALE_CONTEXT_TYPES.DEEP]:
    "Deep context: Enables setting context for specific keys within JSON files and regular files",
};

const AI_SERVICE_PROVIDERS = {
  OPENAI: "openAI",
  MISTRALAI: "mistralAI",
};

module.exports = {
  LOCALE_CONTEXT_TYPES,
  LOCALE_CONTEXT_DESCRIPTIONS,
  AI_SERVICE_PROVIDERS,
};
