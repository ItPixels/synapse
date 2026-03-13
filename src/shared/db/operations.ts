import type { ContextCard, Conversation, Message } from "@/shared/types";
import { type ConversationRecord, db } from "./dexie-schema";

/**
 * Create or update a conversation with new messages.
 */
export async function upsertConversation(
  data: Pick<Conversation, "id" | "platform" | "platformConversationId" | "title"> & {
    messages: Message[];
  },
): Promise<void> {
  const existing = await db.conversations.get(data.id);
  const now = Date.now();

  if (existing) {
    await db.conversations.update(data.id, {
      title: data.title,
      messages: data.messages,
      messageCount: data.messages.length,
      updatedAt: now,
      syncStatus: "pending",
    });
  } else {
    const record: ConversationRecord = {
      id: data.id,
      platform: data.platform,
      platformConversationId: data.platformConversationId,
      title: data.title,
      messages: data.messages,
      tags: [],
      autoTags: [],
      createdAt: now,
      updatedAt: now,
      messageCount: data.messages.length,
      tokenEstimate: 0,
      isArchived: false,
      isFavorite: false,
      syncStatus: "local",
      contextCardId: null,
    };
    await db.conversations.add(record);
  }
}

/**
 * Save a context card and link it to the conversation.
 */
export async function saveContextCard(card: ContextCard): Promise<void> {
  await db.contextCards.put(card);
  await db.conversations.update(card.conversationId, {
    contextCardId: card.id,
    autoTags: card.topics,
  });
}

/**
 * Get a conversation by its platform-specific ID.
 */
export async function getConversationByPlatformId(
  platformConversationId: string,
): Promise<ConversationRecord | undefined> {
  return db.conversations.where("platformConversationId").equals(platformConversationId).first();
}

/**
 * Get recent context cards from OTHER platforms (for suggestions).
 */
export async function getRecentCards(
  excludePlatform: string,
  limit = 5,
  maxAgeMs = 24 * 60 * 60 * 1000,
): Promise<ContextCard[]> {
  const cutoff = Date.now() - maxAgeMs;
  const allCards = await db.contextCards.where("createdAt").above(cutoff).reverse().toArray();

  const filtered: ContextCard[] = [];
  for (const card of allCards) {
    if (filtered.length >= limit) break;
    const conv = await db.conversations.get(card.conversationId);
    if (conv && conv.platform !== excludePlatform) {
      filtered.push(card);
    }
  }
  return filtered;
}

/**
 * Get all conversations, sorted by most recent.
 */
export async function getAllConversations(limit = 50): Promise<ConversationRecord[]> {
  return db.conversations.orderBy("updatedAt").reverse().limit(limit).toArray();
}

/**
 * Delete a conversation and its context card.
 */
export async function deleteConversation(id: string): Promise<void> {
  await db.contextCards.where("conversationId").equals(id).delete();
  await db.conversations.delete(id);
}

/**
 * Delete all data.
 */
export async function clearAllData(): Promise<void> {
  await db.conversations.clear();
  await db.contextCards.clear();
}
