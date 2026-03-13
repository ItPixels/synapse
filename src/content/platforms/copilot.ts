import { PLATFORM_CONFIGS } from "@/shared/constants/platforms";
import type { Message } from "@/shared/types";
import { BasePlatformAdapter } from "./base-platform";

export class CopilotAdapter extends BasePlatformAdapter {
  platform = "copilot" as const;
  selectors = PLATFORM_CONFIGS.copilot.selectors;

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
    // Copilot URL doesn't always have a conversation ID in the path
    // Fall back to a search param or generate from page state
    const match = window.location.pathname.match(/\/c\/([a-zA-Z0-9_-]+)/);
    if (match?.[1]) return match[1];

    const threadParam = new URL(window.location.href).searchParams.get("threadId");
    return threadParam ?? null;
  }
}
