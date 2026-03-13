/**
 * Clean HTML/DOM text content for summarization.
 * Removes artifacts, normalizes whitespace, strips invisible chars.
 */
export function cleanText(raw: string): string {
  let text = raw;

  // Remove zero-width characters
  text = text.replace(/[\u200B-\u200D\uFEFF]/g, "");

  // Normalize various dash types to standard hyphen
  text = text.replace(/[\u2013\u2014]/g, "-");

  // Normalize quotes
  text = text.replace(/[\u201C\u201D]/g, '"');
  text = text.replace(/[\u2018\u2019]/g, "'");

  // Collapse multiple newlines to max 2
  text = text.replace(/\n{3,}/g, "\n\n");

  // Collapse multiple spaces to single
  text = text.replace(/ {2,}/g, " ");

  // Remove common UI artifacts from AI platforms
  text = text.replace(/^(Copy|Copied|Edit|Retry|Regenerate)\s*$/gm, "");
  text = text.replace(/^\d+\s*\/\s*\d+\s*$/gm, ""); // "1 / 3" pagination
  text = text.replace(/^(👍|👎|🔄)\s*$/gm, ""); // reaction buttons

  // Trim each line
  text = text
    .split("\n")
    .map((line) => line.trim())
    .join("\n");

  // Final trim
  return text.trim();
}

/**
 * Format messages into a conversation transcript for summarization.
 */
export function formatTranscript(
  messages: Array<{ role: string; content: string }>,
  maxMessages = 30,
): string {
  const selected = messages.slice(-maxMessages);

  return selected
    .map((msg) => {
      const role = msg.role === "user" ? "User" : "AI";
      const content = cleanText(msg.content);
      return `${role}: ${content}`;
    })
    .join("\n\n");
}
