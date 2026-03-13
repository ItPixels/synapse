/**
 * Approximate token counter.
 * Uses a heuristic: ~4 characters per token for English, ~2 for CJK/Cyrillic.
 * Accuracy target: within 10% of actual tokenizer.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;

  // Count words (split by whitespace)
  const words = text.split(/\s+/).filter(Boolean);

  // Rough heuristic: ~1.3 tokens per word for English
  // Code tends to have more tokens per character
  const hasCode = /[{}();=<>]/.test(text);
  const multiplier = hasCode ? 1.5 : 1.3;

  return Math.ceil(words.length * multiplier);
}

/**
 * Truncate text to approximately fit within a token budget.
 */
export function truncateToTokenBudget(text: string, maxTokens: number): string {
  const estimated = estimateTokens(text);
  if (estimated <= maxTokens) return text;

  // Approximate characters per token
  const ratio = text.length / estimated;
  const targetChars = Math.floor(maxTokens * ratio);

  return text.slice(0, targetChars);
}
