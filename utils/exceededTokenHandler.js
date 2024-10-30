const { GPT4Tokenizer } = require("gpt4-tokenizer");

function splitTextIntoChunks(text, tokenLimit = 10000) {
  const tokenizer = new GPT4Tokenizer({ type: "gpt-4" });
  const paragraphs = text.split("\n\n"); // Split the text into paragraphs
  const chunks = [];

  for (const paragraph of paragraphs) {
    let chunk = "";
    let tokenCount = 0;

    for (const sentence of paragraph.split(".")) {
      const sentenceTokenCount = tokenizer.estimateTokenCount(sentence);

      if (tokenCount + sentenceTokenCount > tokenLimit) {
        chunks.push(chunk.trim());
        chunk = sentence;
        tokenCount = sentenceTokenCount;
      } else {
        chunk += sentence + ". ";
        tokenCount += sentenceTokenCount;
      }
    }

    if (chunk) {
      chunks.push(chunk.trim());
    }
  }

  return chunks;
}

module.exports = { splitTextIntoChunks };
