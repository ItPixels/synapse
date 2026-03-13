import { type ConversationRecord, db } from "@/shared/db/dexie-schema";
import type { ContextCard } from "@/shared/types";
import { supabase } from "./supabase";
import type { Database } from "./supabase-types";

type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"];
type ConversationInsert = Database["public"]["Tables"]["conversations"]["Insert"];
type ContextCardInsert = Database["public"]["Tables"]["context_cards"]["Insert"];

/**
 * Sync status tracking.
 */
export interface SyncResult {
  pushed: number;
  pulled: number;
  errors: string[];
}

/**
 * Full two-way sync: push local changes, then pull remote changes.
 */
export async function syncAll(): Promise<SyncResult> {
  const result: SyncResult = { pushed: 0, pulled: 0, errors: [] };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    result.errors.push("Not authenticated");
    return result;
  }

  const pushResult = await pushToRemote(user.id);
  result.pushed = pushResult.pushed;
  result.errors.push(...pushResult.errors);

  const pullResult = await pullFromRemote(user.id);
  result.pulled = pullResult.pulled;
  result.errors.push(...pullResult.errors);

  return result;
}

/**
 * Push local conversations and context cards to Supabase.
 */
async function pushToRemote(userId: string): Promise<{ pushed: number; errors: string[] }> {
  const errors: string[] = [];
  let pushed = 0;

  const pendingConvs = await db.conversations
    .where("syncStatus")
    .anyOf(["local", "pending"])
    .toArray();

  for (const conv of pendingConvs) {
    const row: ConversationInsert = {
      id: conv.id,
      user_id: userId,
      platform: conv.platform,
      platform_conversation_id: conv.platformConversationId,
      title: conv.title,
      messages: JSON.stringify(conv.messages),
      message_count: conv.messageCount,
      token_estimate: conv.tokenEstimate,
      tags: conv.tags,
      auto_tags: conv.autoTags,
      is_archived: conv.isArchived,
      is_favorite: conv.isFavorite,
      created_at: new Date(conv.createdAt).toISOString(),
      updated_at: new Date(conv.updatedAt).toISOString(),
    };

    const { error } = await supabase.from("conversations").upsert(row as never);

    if (error) {
      errors.push(`Push conversation ${conv.id}: ${error.message}`);
      continue;
    }

    if (conv.contextCardId) {
      const card = await db.contextCards.get(conv.contextCardId);
      if (card) {
        const cardRow: ContextCardInsert = {
          id: card.id,
          user_id: userId,
          conversation_id: card.conversationId,
          summary: card.summary,
          key_points: card.keyPoints,
          generated_prompt: card.generatedPrompt,
          topics: card.topics,
          entities: card.entities,
          intent: card.intent,
          continuation_hints: card.continuationHints,
          created_at: new Date(card.createdAt).toISOString(),
        };

        const { error: cardError } = await supabase.from("context_cards").upsert(cardRow as never);

        if (cardError) {
          errors.push(`Push card ${card.id}: ${cardError.message}`);
          continue;
        }
      }
    }

    await db.conversations.update(conv.id, { syncStatus: "synced" });
    pushed++;
  }

  return { pushed, errors };
}

/**
 * Pull remote conversations and context cards from Supabase.
 */
async function pullFromRemote(userId: string): Promise<{ pulled: number; errors: string[] }> {
  const errors: string[] = [];
  let pulled = 0;

  const latestLocal = await db.conversations.orderBy("updatedAt").reverse().first();
  const since = latestLocal
    ? new Date(latestLocal.updatedAt).toISOString()
    : "1970-01-01T00:00:00Z";

  const { data: remoteConvs, error: convError } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .gt("updated_at", since)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (convError) {
    errors.push(`Pull conversations: ${convError.message}`);
    return { pulled, errors };
  }

  const rows = (remoteConvs ?? []) as ConversationRow[];

  for (const remote of rows) {
    const local = await db.conversations.get(remote.id);

    if (local && local.updatedAt >= new Date(remote.updated_at).getTime()) {
      continue;
    }

    const record: ConversationRecord = {
      id: remote.id,
      platform: remote.platform as ConversationRecord["platform"],
      platformConversationId: remote.platform_conversation_id,
      title: remote.title,
      messages: JSON.parse(remote.messages),
      messageCount: remote.message_count,
      tokenEstimate: remote.token_estimate,
      tags: remote.tags,
      autoTags: remote.auto_tags,
      isArchived: remote.is_archived,
      isFavorite: remote.is_favorite,
      createdAt: new Date(remote.created_at).getTime(),
      updatedAt: new Date(remote.updated_at).getTime(),
      syncStatus: "synced",
      contextCardId: null,
    };

    await db.conversations.put(record);
    pulled++;
  }

  if (pulled > 0) {
    const convIds = rows.map((c) => c.id);
    const { data: remoteCards, error: cardError } = await supabase
      .from("context_cards")
      .select("*")
      .eq("user_id", userId)
      .in("conversation_id", convIds);

    if (cardError) {
      errors.push(`Pull cards: ${cardError.message}`);
    } else {
      for (const rc of (remoteCards ??
        []) as Database["public"]["Tables"]["context_cards"]["Row"][]) {
        const card: ContextCard = {
          id: rc.id,
          conversationId: rc.conversation_id,
          summary: rc.summary,
          keyPoints: rc.key_points,
          generatedPrompt: rc.generated_prompt,
          topics: rc.topics,
          entities: rc.entities,
          intent: rc.intent as ContextCard["intent"],
          continuationHints: rc.continuation_hints,
          quality: "brief",
          createdAt: new Date(rc.created_at).getTime(),
          expiresAt: null,
        };

        await db.contextCards.put(card);
        await db.conversations.update(rc.conversation_id, { contextCardId: rc.id });
      }
    }
  }

  return { pulled, errors };
}

/**
 * Sync a single conversation immediately (e.g., after summarization).
 */
export async function syncConversation(conversationId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const conv = await db.conversations.get(conversationId);
  if (!conv) return false;

  const row: ConversationInsert = {
    id: conv.id,
    user_id: user.id,
    platform: conv.platform,
    platform_conversation_id: conv.platformConversationId,
    title: conv.title,
    messages: JSON.stringify(conv.messages),
    message_count: conv.messageCount,
    token_estimate: conv.tokenEstimate,
    tags: conv.tags,
    auto_tags: conv.autoTags,
    is_archived: conv.isArchived,
    is_favorite: conv.isFavorite,
    created_at: new Date(conv.createdAt).toISOString(),
    updated_at: new Date(conv.updatedAt).toISOString(),
  };

  const { error } = await supabase.from("conversations").upsert(row as never);
  if (error) return false;

  await db.conversations.update(conversationId, { syncStatus: "synced" });
  return true;
}
