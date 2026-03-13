import { initAlarms } from "./alarms";
import { initMessageRouter } from "./message-router";

initMessageRouter();
initAlarms();

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // biome-ignore lint/suspicious/noConsole: expected for install event
    console.log("[Synapse] Extension installed");

    // Set default API key if provided via env at build time
    const envKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
    if (envKey) {
      chrome.storage.local.set({ anthropicApiKey: envKey });
    }
  }
});

// biome-ignore lint/suspicious/noConsole: startup log
console.log("[Synapse] Background service worker initialized");
