import type { AIPlatform } from "./platform";

export type ConversationIntent =
  | "research"
  | "coding"
  | "writing"
  | "brainstorm"
  | "analysis"
  | "debug"
  | "learning"
  | "planning"
  | "creative"
  | "general";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  platform: AIPlatform;
}

export interface ContextCard {
  id: string;
  conversationId: string;
  summary: string;
  keyPoints: string[];
  generatedPrompt: string;
  topics: string[];
  entities: string[];
  intent: ConversationIntent;
  continuationHints: string[];
  quality: "brief" | "detailed";
  createdAt: number;
  expiresAt: number | null;
}

export type SyncStatus = "local" | "synced" | "pending";

export interface Conversation {
  id: string;
  platform: AIPlatform;
  platformConversationId: string;
  title: string;
  messages: Message[];
  contextCard: ContextCard | null;
  tags: string[];
  autoTags: string[];
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  tokenEstimate: number;
  isArchived: boolean;
  isFavorite: boolean;
  syncStatus: SyncStatus;
}
