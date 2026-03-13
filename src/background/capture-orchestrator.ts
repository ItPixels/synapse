import { summarizeMessages } from "@/shared/api/summarize";
import {
  canCapture,
  canSummarize,
  getCachedSubscription,
  incrementCaptureUsage,
  incrementSummarizationUsage,
} from "@/shared/api/usage";
import {
  getConversationByPlatformId,
  saveContextCard,
  upsertConversation,
} from "@/shared/db/operations";
import { sendToContent } from "@/shared/messaging/bridge";
import type { ContentToBackgroundMessages } from "@/shared/messaging/types";

// Map tabId → stable conversation UUID
const tabConversationMap = new Map<number, string>();

// Track which conversations have been summarized (avoid re-summarizing on every keystroke)
const summarizedAt = new Map<string, number>();

export function handlePlatformDetected(
  tabId: number,
  payload: ContentToBackgroundMessages["PLATFORM_DETECTED"],
): void {
  // biome-ignore lint/suspicious/noConsole: debug logging
  console.log(`[Synapse] Platform detected: ${payload.platform} on tab ${tabId}`);

  sendToContent(tabId, "CAPTURE_STATUS", { isCapturing: true });
}

export async function handleNewMessages(
  tabId: number,
  payload: ContentToBackgroundMessages["NEW_MESSAGES"],
): Promise<void> {
  const { platform, conversationId, title, messages } = payload;

  if (messages.length === 0) return;

  // Check capture usage limits
  const sub = await getCachedSubscription();
  if (!(await canCapture(sub.plan))) {
    // biome-ignore lint/suspicious/noConsole: debug logging
    console.log("[Synapse] Capture limit reached, skipping");
    return;
  }

  // Get or create a stable UUID for this conversation
  const isNewConversation = !tabConversationMap.has(tabId);
  let stableId = tabConversationMap.get(tabId);

  if (!stableId && conversationId) {
    const existing = await getConversationByPlatformId(conversationId);
    if (existing) {
      stableId = existing.id;
    }
  }

  if (!stableId) {
    stableId = crypto.randomUUID();
  }

  tabConversationMap.set(tabId, stableId);

  await upsertConversation({
    id: stableId,
    platform,
    platformConversationId: conversationId,
    title: title || "Untitled",
    messages,
  });

  // Track usage for new conversations
  if (isNewConversation) {
    await incrementCaptureUsage();
  }

  // biome-ignore lint/suspicious/noConsole: debug logging
  console.log(
    `[Synapse] Saved ${messages.length} messages for conversation ${stableId} (${platform})`,
  );

  // Auto-summarize if enough messages and not recently summarized
  await maybeSummarize(stableId, messages);
}

async function maybeSummarize(
  conversationId: string,
  messages: ContentToBackgroundMessages["NEW_MESSAGES"]["messages"],
): Promise<void> {
  // Need minimum messages
  if (messages.length < 3) return;

  // Check summarization usage limits
  const sub = await getCachedSubscription();
  if (!(await canSummarize(sub.plan))) {
    // biome-ignore lint/suspicious/noConsole: debug logging
    console.log("[Synapse] Summarization limit reached, skipping");
    return;
  }

  // Don't re-summarize too frequently (minimum 60 seconds between summaries)
  const lastSummarized = summarizedAt.get(conversationId);
  if (lastSummarized && Date.now() - lastSummarized < 60_000) return;

  // Only re-summarize when message count changes significantly
  // (every 5 new messages after initial summary)
  if (lastSummarized && messages.length % 5 !== 0) return;

  summarizedAt.set(conversationId, Date.now());

  // biome-ignore lint/suspicious/noConsole: debug logging
  console.log(`[Synapse] Summarizing conversation ${conversationId} (${messages.length} messages)`);

  const card = await summarizeMessages(conversationId, messages);
  if (card) {
    await saveContextCard(card);
    await incrementSummarizationUsage();
    // biome-ignore lint/suspicious/noConsole: debug logging
    console.log(`[Synapse] Context card saved for ${conversationId}`);
  }
}
