import type { AIPlatform } from "./platform";

export interface UserSettings {
  // Capture
  enabledPlatforms: AIPlatform[];
  autoCaptureEnabled: boolean;
  captureMinMessages: number;

  // Suggestions
  suggestionsEnabled: boolean;
  suggestionsPosition: "top-right" | "bottom-right" | "sidebar";
  maxSuggestionsShown: number;

  // Privacy
  localOnly: boolean;
  encryptLocal: boolean;
  autoDeleteDays: number | null;

  // Appearance
  theme: "system" | "light" | "dark";
  language: "en" | "ru" | "auto";

  // Advanced
  summaryQuality: "brief" | "detailed";
  customSystemPrompt: string | null;
}

export const DEFAULT_SETTINGS: UserSettings = {
  enabledPlatforms: ["chatgpt", "claude", "gemini"],
  autoCaptureEnabled: true,
  captureMinMessages: 3,

  suggestionsEnabled: true,
  suggestionsPosition: "bottom-right",
  maxSuggestionsShown: 3,

  localOnly: true,
  encryptLocal: false,
  autoDeleteDays: null,

  theme: "system",
  language: "auto",

  summaryQuality: "brief",
  customSystemPrompt: null,
};
