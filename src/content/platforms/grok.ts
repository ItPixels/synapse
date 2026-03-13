import { PLATFORM_CONFIGS } from "@/shared/constants/platforms";
import type { Message } from "@/shared/types";
import { BasePlatformAdapter } from "./base-platform";

export class GrokAdapter extends BasePlatformAdapter {
  platform = "grok" as const;
  selectors = PLATFORM_CONFIGS.grok.selectors;

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
    // Grok URL format: /chat/{id} or embedded in x.com/grok
    const match = window.location.pathname.match(/\/(?:chat|grok)\/([a-zA-Z0-9_-]+)/);
    return match?.[1] ?? null;
  }
}
