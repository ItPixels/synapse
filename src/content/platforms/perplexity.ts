import { PLATFORM_CONFIGS } from "@/shared/constants/platforms";
import type { Message } from "@/shared/types";
import { BasePlatformAdapter } from "./base-platform";

export class PerplexityAdapter extends BasePlatformAdapter {
  platform = "perplexity" as const;
  selectors = PLATFORM_CONFIGS.perplexity.selectors;

  extractMessages(): Message[] {
    const messages: Message[] = [];
    const now = Date.now();

    const container = this.getMessageContainer();
    if (!container) return messages;

    const allMessageEls = container.querySelectorAll(
      [...this.selectors.userMessage, ...this.selectors.assistantMessage].join(", "),
    );

    for (const el of allMessageEls) {
      const isUser = this.selectors.userMessage.some((sel) => el.matches(sel) || el.closest(sel));

      const content = el.textContent?.trim();
      if (!content) continue;

      messages.push({
        id: crypto.randomUUID(),
        role: isUser ? "user" : "assistant",
        content,
        timestamp: now,
        platform: this.platform,
      });
    }

    return messages;
  }

  getConversationId(): string | null {
    // Perplexity URL format: /search/{id} or /thread/{id}
    const match = window.location.pathname.match(/\/(?:search|thread)\/([a-zA-Z0-9_-]+)/);
    return match?.[1] ?? null;
  }
}
