import { onContentMessage, sendToContent } from "@/shared/messaging/bridge";
import { handleNewMessages, handlePlatformDetected } from "./capture-orchestrator";
import { getSuggestions } from "./suggestion-engine";

/**
 * Sets up all message listeners in the background service worker.
 */
export function initMessageRouter(): void {
  onContentMessage("PLATFORM_DETECTED", (payload, sender) => {
    const tabId = sender.tab?.id;
    if (tabId == null) return;
    handlePlatformDetected(tabId, payload);
  });

  onContentMessage("NEW_MESSAGES", (payload, sender) => {
    const tabId = sender.tab?.id;
    if (tabId == null) return;
    handleNewMessages(tabId, payload);
  });

  onContentMessage("REQUEST_SUGGESTIONS", async (payload, sender) => {
    const tabId = sender.tab?.id;
    if (tabId == null) return;

    const suggestions = await getSuggestions(payload.platform);
    if (suggestions.length > 0) {
      sendToContent(tabId, "SHOW_SUGGESTIONS", { suggestions });
    }
  });
}
