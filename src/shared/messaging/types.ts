import type { AIPlatform, ContextCard, Message } from "@/shared/types";

/** Serializable suggestion for messaging (no functions/classes) */
export interface SuggestionPayload {
  /** Primary card */
  card: ContextCard;
  /** Related cards from other conversations on same topic */
  relatedCards: ContextCard[];
  /** Combined score (0-1) */
  score: number;
  /** Merged prompt if multiple related cards exist */
  mergedPrompt: string;
  /** Platforms involved */
  platforms: string[];
}

// Content Script → Background
export interface ContentToBackgroundMessages {
  PLATFORM_DETECTED: { platform: AIPlatform; url: string };
  NEW_MESSAGES: {
    platform: AIPlatform;
    conversationId: string;
    title: string;
    messages: Message[];
  };
  REQUEST_SUGGESTIONS: { platform: AIPlatform };
  CAPTURE_PAUSED: undefined;
  CAPTURE_RESUMED: undefined;
}

// Background → Content Script
export interface BackgroundToContentMessages {
  SHOW_SUGGESTIONS: { suggestions: SuggestionPayload[] };
  CAPTURE_STATUS: { isCapturing: boolean };
}

export type MessageType = keyof ContentToBackgroundMessages | keyof BackgroundToContentMessages;

export interface TypedMessage<T extends MessageType> {
  type: T;
  payload: T extends keyof ContentToBackgroundMessages
    ? ContentToBackgroundMessages[T]
    : T extends keyof BackgroundToContentMessages
      ? BackgroundToContentMessages[T]
      : never;
}
