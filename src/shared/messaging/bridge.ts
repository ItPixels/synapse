import type {
  BackgroundToContentMessages,
  ContentToBackgroundMessages,
  TypedMessage,
} from "./types";

/**
 * Send a message from Content Script to Background Service Worker.
 */
export function sendToBackground<T extends keyof ContentToBackgroundMessages>(
  type: T,
  payload: ContentToBackgroundMessages[T],
): Promise<void> {
  return chrome.runtime.sendMessage({ type, payload } as TypedMessage<T>);
}

/**
 * Send a message from Background to a specific tab's Content Script.
 */
export function sendToContent<T extends keyof BackgroundToContentMessages>(
  tabId: number,
  type: T,
  payload: BackgroundToContentMessages[T],
): Promise<void> {
  return chrome.tabs.sendMessage(tabId, { type, payload } as TypedMessage<T>);
}

/**
 * Listen for messages in Background Service Worker (from Content Scripts).
 */
export function onContentMessage<T extends keyof ContentToBackgroundMessages>(
  type: T,
  handler: (
    payload: ContentToBackgroundMessages[T],
    sender: chrome.runtime.MessageSender,
  ) => void | Promise<void>,
): void {
  chrome.runtime.onMessage.addListener((message: TypedMessage<T>, sender) => {
    if (message.type === type) {
      handler(message.payload, sender);
    }
  });
}

/**
 * Listen for messages in Content Script (from Background).
 */
export function onBackgroundMessage<T extends keyof BackgroundToContentMessages>(
  type: T,
  handler: (payload: BackgroundToContentMessages[T]) => void | Promise<void>,
): void {
  chrome.runtime.onMessage.addListener((message: TypedMessage<T>) => {
    if (message.type === type) {
      handler(message.payload);
    }
  });
}
