import { onBackgroundMessage, sendToBackground } from "@/shared/messaging/bridge";
import type { AIPlatform } from "@/shared/types";
import { detectPlatform } from "./detector";
import { showSuggestionWidget } from "./injector";
import { createDebouncedObserver } from "./observer";
import type { BasePlatformAdapter } from "./platforms/base-platform";
import { ChatGPTAdapter } from "./platforms/chatgpt";
import { ClaudeAdapter } from "./platforms/claude";
import { CopilotAdapter } from "./platforms/copilot";
import { DeepSeekAdapter } from "./platforms/deepseek";
import { GeminiAdapter } from "./platforms/gemini";
import { GrokAdapter } from "./platforms/grok";
import { MistralAdapter } from "./platforms/mistral";
import { PerplexityAdapter } from "./platforms/perplexity";

function createAdapter(platform: AIPlatform): BasePlatformAdapter | null {
  switch (platform) {
    case "chatgpt":
      return new ChatGPTAdapter();
    case "claude":
      return new ClaudeAdapter();
    case "gemini":
      return new GeminiAdapter();
    case "perplexity":
      return new PerplexityAdapter();
    case "grok":
      return new GrokAdapter();
    case "deepseek":
      return new DeepSeekAdapter();
    case "mistral":
      return new MistralAdapter();
    case "copilot":
      return new CopilotAdapter();
    default:
      return null;
  }
}

function init(): void {
  const url = window.location.href;
  const platform = detectPlatform(url);

  if (!platform) return;

  // biome-ignore lint/suspicious/noConsole: startup log
  console.log(`[Synapse] Detected platform: ${platform}`);

  const adapter = createAdapter(platform);
  if (!adapter) return;

  sendToBackground("PLATFORM_DETECTED", { platform, url });

  // Listen for suggestions from background
  onBackgroundMessage("SHOW_SUGGESTIONS", (payload) => {
    if (payload.suggestions.length > 0) {
      showSuggestionWidget(payload.suggestions);
    }
  });

  // Request suggestions on page load (cross-platform context)
  sendToBackground("REQUEST_SUGGESTIONS", { platform });

  // Wait for the chat container to appear (SPAs may load async)
  const waitForContainer = setInterval(() => {
    if (!adapter.hasChatContainer()) return;
    clearInterval(waitForContainer);
    startCapture(adapter);
  }, 1000);

  // Give up after 30 seconds
  setTimeout(() => clearInterval(waitForContainer), 30000);
}

function startCapture(adapter: BasePlatformAdapter): void {
  const container = adapter.getMessageContainer();
  if (!container) return;

  // biome-ignore lint/suspicious/noConsole: debug
  console.log(`[Synapse] Starting capture on ${adapter.platform}`);

  let lastMessageCount = 0;

  createDebouncedObserver(container, () => {
    const messages = adapter.extractMessages();
    if (messages.length === lastMessageCount) return;
    lastMessageCount = messages.length;

    const conversationId = adapter.getConversationId() ?? "unknown";
    const title = adapter.getConversationTitle() ?? "Untitled";

    sendToBackground("NEW_MESSAGES", {
      platform: adapter.platform,
      conversationId,
      title,
      messages,
    });
  });
}

init();
