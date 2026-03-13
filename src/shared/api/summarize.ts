import { RATE_LIMITS } from "@/shared/constants/limits";
import { SUMMARIZATION_SYSTEM_PROMPT } from "@/shared/constants/prompts";
import type { ContextCard, Message } from "@/shared/types";
import { summarizationLimiter } from "@/shared/utils/rate-limiter";
import { formatTranscript } from "@/shared/utils/text-cleaner";
import { safeParse, summarizationResponseSchema } from "@/shared/utils/validation";

/**
 * Get the Anthropic API key from chrome.storage.local.
 */
async function getApiKey(): Promise<string | null> {
  const result = await chrome.storage.local.get("anthropicApiKey");
  return (result.anthropicApiKey as string) ?? null;
}

/**
 * Call Anthropic API to generate a context card from messages.
 */
export async function summarizeMessages(
  conversationId: string,
  messages: Message[],
  quality: "brief" | "detailed" = "brief",
): Promise<ContextCard | null> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    // biome-ignore lint/suspicious/noConsole: error logging
    console.warn("[Synapse] No Anthropic API key configured");
    return null;
  }

  // Rate limit check
  if (!summarizationLimiter.record()) {
    // biome-ignore lint/suspicious/noConsole: rate limit logging
    console.warn("[Synapse] Rate limit hit, waiting before summarizing");
    return null;
  }

  const transcript = formatTranscript(messages, RATE_LIMITS.maxMessagesForSummary);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: quality === "brief" ? 800 : 1500,
      system: SUMMARIZATION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: transcript,
        },
      ],
    }),
  });

  if (!response.ok) {
    // biome-ignore lint/suspicious/noConsole: error logging
    console.error("[Synapse] Summarization API error:", response.status);
    return null;
  }

  const data = await response.json();
  const content = data?.content?.[0]?.text;
  if (!content) return null;

  const parsed = parseSummarizationResponse(content);
  if (!parsed) return null;

  return {
    id: crypto.randomUUID(),
    conversationId,
    summary: parsed.summary,
    keyPoints: parsed.keyPoints,
    generatedPrompt: parsed.generatedPrompt,
    topics: parsed.topics,
    entities: parsed.entities,
    intent: parsed.intent,
    continuationHints: parsed.continuationHints,
    quality,
    createdAt: Date.now(),
    expiresAt: null,
  };
}

/**
 * Parse the JSON response from the summarization API using Zod validation.
 */
function parseSummarizationResponse(raw: string) {
  try {
    // Handle potential markdown wrapping
    let cleaned = raw.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const json = JSON.parse(cleaned);
    return safeParse(summarizationResponseSchema, json);
  } catch {
    // biome-ignore lint/suspicious/noConsole: error logging
    console.error("[Synapse] Failed to parse summarization response");
    return null;
  }
}
