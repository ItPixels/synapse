import { db } from "@/shared/db/dexie-schema";
import type { ContextCard } from "@/shared/types";

export interface ScoredSuggestion {
  /** Primary card (highest score in group) */
  card: ContextCard;
  /** Related cards on the same topic from other platforms */
  relatedCards: ContextCard[];
  /** Combined score */
  score: number;
  /** Merged prompt if multiple related cards exist */
  mergedPrompt: string;
  /** Platforms involved */
  platforms: string[];
}

/**
 * Find relevant suggestions for the current platform.
 * Groups cards by overlapping topics and merges prompts.
 */
export async function getSuggestions(
  currentPlatform: string,
  limit = 3,
  maxAgeMs = 24 * 60 * 60 * 1000,
): Promise<ScoredSuggestion[]> {
  const cutoff = Date.now() - maxAgeMs;

  // Get all recent cards
  const allCards = await db.contextCards.where("createdAt").above(cutoff).reverse().toArray();

  // Get conversations to know which platform each card belongs to
  const convMap = new Map<string, string>(); // conversationId → platform
  for (const card of allCards) {
    const conv = await db.conversations.get(card.conversationId);
    if (conv) convMap.set(card.conversationId, conv.platform);
  }

  // Filter out cards from the current platform (we want cross-platform suggestions)
  const otherPlatformCards = allCards.filter((card) => {
    const platform = convMap.get(card.conversationId);
    return platform && platform !== currentPlatform;
  });

  if (otherPlatformCards.length === 0) return [];

  // Group cards by overlapping topics
  const groups = groupByTopics(otherPlatformCards);

  // Score and sort groups
  const scored = groups.map((group) => scoreGroup(group, convMap));
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}

interface CardGroup {
  cards: ContextCard[];
  sharedTopics: string[];
}

/**
 * Group cards that share overlapping topics.
 * Cards about "chinese tea" from ChatGPT and Claude will end up in the same group.
 */
function groupByTopics(cards: ContextCard[]): CardGroup[] {
  const groups: CardGroup[] = [];
  const assigned = new Set<string>();

  for (const card of cards) {
    if (assigned.has(card.id)) continue;

    // Find all cards that share at least one topic with this card
    const related = cards.filter((other) => {
      if (other.id === card.id || assigned.has(other.id)) return false;
      return hasTopicOverlap(card, other);
    });

    const groupCards = [card, ...related];
    for (const c of groupCards) assigned.add(c.id);

    // Find shared topics across the group
    const sharedTopics = findSharedTopics(groupCards);

    groups.push({ cards: groupCards, sharedTopics });
  }

  return groups;
}

/**
 * Check if two cards share overlapping topics or entities.
 */
function hasTopicOverlap(a: ContextCard, b: ContextCard): boolean {
  // Check topic overlap
  const topicOverlap = a.topics.some((t) =>
    b.topics.some((bt) => normalizeForMatch(t) === normalizeForMatch(bt)),
  );
  if (topicOverlap) return true;

  // Check entity overlap (e.g. both mention "React" or "Python")
  const entityOverlap = a.entities.some((e) =>
    b.entities.some((be) => normalizeForMatch(e) === normalizeForMatch(be)),
  );
  if (entityOverlap) return true;

  // Check if intents match AND have keyword overlap in summaries
  if (a.intent === b.intent && a.intent !== "general") {
    const aWords = extractKeywords(a.summary);
    const bWords = extractKeywords(b.summary);
    const overlap = aWords.filter((w) => bWords.includes(w));
    if (overlap.length >= 2) return true;
  }

  return false;
}

function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[-_\s]+/g, " ");
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "is",
    "was",
    "are",
    "were",
    "be",
    "been",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "can",
    "shall",
    "and",
    "or",
    "but",
    "if",
    "then",
    "else",
    "when",
    "where",
    "how",
    "what",
    "which",
    "who",
    "whom",
    "this",
    "that",
    "to",
    "of",
    "in",
    "for",
    "on",
    "with",
    "at",
    "by",
    "from",
    "about",
    "into",
    "through",
    "during",
    "before",
    "after",
    "it",
    "its",
    "they",
    "them",
    "their",
    "we",
    "our",
    "you",
    "your",
    "не",
    "и",
    "в",
    "на",
    "с",
    "по",
    "для",
    "что",
    "как",
    "это",
    "из",
    "о",
    "от",
    "за",
    "до",
    "при",
    "без",
    "но",
    "а",
    "или",
  ]);

  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
}

function findSharedTopics(cards: ContextCard[]): string[] {
  if (cards.length <= 1) return cards[0]?.topics ?? [];

  const topicCounts = new Map<string, number>();
  for (const card of cards) {
    for (const topic of card.topics) {
      const normalized = normalizeForMatch(topic);
      topicCounts.set(normalized, (topicCounts.get(normalized) ?? 0) + 1);
    }
  }

  // Topics that appear in 2+ cards
  const shared = [...topicCounts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([topic]) => topic);

  // If no shared topics, return all unique topics
  return shared.length > 0
    ? shared
    : [...new Set(cards.flatMap((c) => c.topics.map(normalizeForMatch)))];
}

/**
 * Score a group of related cards.
 */
function scoreGroup(group: CardGroup, convMap: Map<string, string>): ScoredSuggestion {
  const { cards, sharedTopics } = group;

  // Sort by recency (newest first)
  const sorted = [...cards].sort((a, b) => b.createdAt - a.createdAt);
  const primary = sorted[0];
  if (!primary)
    return {
      card: cards[0] as ContextCard,
      relatedCards: [],
      score: 0,
      mergedPrompt: "",
      platforms: [],
    };
  const related = sorted.slice(1);

  // Scoring factors
  const recencyScore = calculateRecencyScore(primary.createdAt);
  const topicRichness = Math.min(sharedTopics.length / 3, 1); // max 1.0
  const platformDiversity = new Set(cards.map((c) => convMap.get(c.conversationId))).size;
  const diversityScore = Math.min(platformDiversity / 3, 1); // max 1.0
  const multiPlatformBonus = cards.length > 1 ? 0.3 : 0; // bonus for cross-platform topic

  const score =
    recencyScore * 0.4 + topicRichness * 0.2 + diversityScore * 0.2 + multiPlatformBonus;

  // Get all platforms involved
  const platforms = [
    ...new Set(
      cards.map((c) => convMap.get(c.conversationId)).filter((p): p is string => p !== undefined),
    ),
  ];

  // Generate merged prompt if multiple related cards
  const mergedPrompt =
    cards.length > 1 ? buildMergedPrompt(sorted, platforms, sharedTopics) : primary.generatedPrompt;

  return {
    card: primary,
    relatedCards: related,
    score,
    mergedPrompt,
    platforms,
  };
}

function calculateRecencyScore(timestamp: number): number {
  const ageMs = Date.now() - timestamp;
  const ageHours = ageMs / (1000 * 60 * 60);

  // Exponential decay: 1.0 at 0h, ~0.5 at 6h, ~0.25 at 12h, ~0.06 at 24h
  return Math.exp(-ageHours / 8);
}

/**
 * Build a merged prompt combining context from multiple related conversations.
 */
function buildMergedPrompt(
  cards: ContextCard[],
  platforms: string[],
  sharedTopics: string[],
): string {
  const topicStr = sharedTopics.join(", ");
  const platformStr = platforms.join(" and ");

  const keyPointsAll = cards.flatMap((c) => c.keyPoints);
  const uniquePoints = [...new Set(keyPointsAll)].slice(0, 7);

  const continuations = cards.flatMap((c) => c.continuationHints);
  const uniqueContinuations = [...new Set(continuations)].slice(0, 3);

  const parts = [
    `I've been exploring "${topicStr}" across conversations in ${platformStr}.`,
    "",
    "Here's the combined context:",
  ];

  for (const card of cards) {
    const platform = platforms.length > 1 ? ` (from a previous conversation)` : "";
    parts.push(`- ${card.summary}${platform}`);
  }

  parts.push("");
  parts.push("Key points so far:");
  for (const point of uniquePoints) {
    parts.push(`- ${point}`);
  }

  if (uniqueContinuations.length > 0) {
    parts.push("");
    parts.push(`I'd like to continue with: ${uniqueContinuations[0]}`);
  }

  return parts.join("\n");
}
