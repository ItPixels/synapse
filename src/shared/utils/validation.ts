import { z } from "zod";

/**
 * Zod schemas for validating external data (API responses, storage, messaging).
 */

// --- Summarization API response ---
export const summarizationResponseSchema = z.object({
  summary: z.string().min(1),
  keyPoints: z.array(z.string()).default([]),
  generatedPrompt: z.string().min(1),
  topics: z.array(z.string()).default([]),
  entities: z.array(z.string()).default([]),
  intent: z
    .enum([
      "coding",
      "research",
      "writing",
      "brainstorm",
      "analysis",
      "debug",
      "learning",
      "planning",
      "creative",
      "general",
    ])
    .default("general"),
  continuationHints: z.array(z.string()).default([]),
});

export type ValidatedSummarizationResponse = z.infer<typeof summarizationResponseSchema>;

// --- Message from content script ---
export const messageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  timestamp: z.number(),
  platform: z.string(),
});

// --- Content → Background message payloads ---
export const platformDetectedPayloadSchema = z.object({
  platform: z.enum([
    "chatgpt",
    "claude",
    "gemini",
    "perplexity",
    "grok",
    "deepseek",
    "mistral",
    "copilot",
  ]),
  url: z.string().url(),
});

export const newMessagesPayloadSchema = z.object({
  platform: z.enum([
    "chatgpt",
    "claude",
    "gemini",
    "perplexity",
    "grok",
    "deepseek",
    "mistral",
    "copilot",
  ]),
  conversationId: z.string(),
  title: z.string(),
  messages: z.array(messageSchema),
});

// --- User settings ---
export const userSettingsSchema = z.object({
  enabledPlatforms: z.array(z.string()),
  autoCaptureEnabled: z.boolean(),
  captureMinMessages: z.number().int().min(1).max(100),
  suggestionsEnabled: z.boolean(),
  suggestionsPosition: z.enum(["top-right", "bottom-right", "sidebar"]),
  maxSuggestionsShown: z.number().int().min(1).max(10),
  localOnly: z.boolean(),
  encryptLocal: z.boolean(),
  autoDeleteDays: z.number().int().min(1).nullable(),
  theme: z.enum(["system", "light", "dark"]),
  language: z.enum(["en", "ru", "auto"]),
  summaryQuality: z.enum(["brief", "detailed"]),
  customSystemPrompt: z.string().nullable(),
});

/**
 * Safely parse data with a Zod schema.
 * Returns the parsed value or null on failure.
 */
export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  const result = schema.safeParse(data);
  if (result.success) return result.data;

  // biome-ignore lint/suspicious/noConsole: validation error logging
  console.warn("[Synapse] Validation failed:", result.error.issues);
  return null;
}
