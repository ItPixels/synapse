import { PLATFORM_CONFIGS } from "@/shared/constants/platforms";
import type { Message } from "@/shared/types";
import { BasePlatformAdapter } from "./base-platform";

export class GeminiAdapter extends BasePlatformAdapter {
  platform = "gemini" as const;
  selectors = PLATFORM_CONFIGS.gemini.selectors;

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
    // Gemini URL format: /app/{id} or /chat/{id}
    const match = window.location.pathname.match(/\/(?:app|chat)\/([a-zA-Z0-9_-]+)/);
    return match?.[1] ?? null;
  }

  override injectText(text: string): boolean {
    // Gemini uses Quill editor (.ql-editor) which is contenteditable
    const input = this.querySelector(this.selectors.inputField);
    if (!input) return false;

    if (input.getAttribute("contenteditable") === "true") {
      const paragraph = input.querySelector("p");
      if (paragraph) {
        paragraph.textContent = text;
      } else {
        input.textContent = text;
      }
      input.dispatchEvent(new Event("input", { bubbles: true }));
      (input as HTMLElement).focus();
      return true;
    }

    return super.injectText(text);
  }
}
