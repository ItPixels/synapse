import type { AIPlatform, Message, PlatformSelectors } from "@/shared/types";

export abstract class BasePlatformAdapter {
  abstract platform: AIPlatform;
  abstract selectors: PlatformSelectors;

  /**
   * Try each selector in the fallback array and return the first match.
   */
  protected querySelector(selectors: string[]): Element | null {
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) return el;
    }
    return null;
  }

  /**
   * Try each selector in the fallback array and return all matches from the first working selector.
   */
  protected querySelectorAll(selectors: string[]): Element[] {
    for (const selector of selectors) {
      const els = document.querySelectorAll(selector);
      if (els.length > 0) return Array.from(els);
    }
    return [];
  }

  /**
   * Returns the message container element (where messages are rendered).
   */
  getMessageContainer(): Element | null {
    return this.querySelector(this.selectors.messageContainer);
  }

  /**
   * Extract all messages from the DOM.
   */
  abstract extractMessages(): Message[];

  /**
   * Get the platform-specific conversation ID (usually from URL).
   */
  abstract getConversationId(): string | null;

  /**
   * Get the conversation title from the DOM.
   */
  getConversationTitle(): string | null {
    const el = this.querySelector(this.selectors.conversationTitle);
    return el?.textContent?.trim() ?? null;
  }

  /**
   * Inject text into the AI platform's input field.
   */
  injectText(text: string): boolean {
    const input = this.querySelector(this.selectors.inputField);
    if (!input) return false;

    if (input instanceof HTMLTextAreaElement) {
      input.value = text;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    }

    if (input.getAttribute("contenteditable") === "true") {
      input.textContent = text;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    }

    return false;
  }

  /**
   * Check if the page has a chat container (not just a dashboard/settings page).
   */
  hasChatContainer(): boolean {
    return this.getMessageContainer() !== null;
  }
}
