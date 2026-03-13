export type AIPlatform =
  | "chatgpt"
  | "claude"
  | "gemini"
  | "perplexity"
  | "grok"
  | "deepseek"
  | "mistral"
  | "copilot";

export interface PlatformConfig {
  platform: AIPlatform;
  name: string;
  urlPatterns: RegExp[];
  selectors: PlatformSelectors;
}

export interface PlatformSelectors {
  messageContainer: string[];
  userMessage: string[];
  assistantMessage: string[];
  conversationTitle: string[];
  inputField: string[];
  sendButton: string[];
}
