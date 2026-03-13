import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "Synapse — AI Memory Bridge",
  version: "0.1.0",
  description:
    "Seamlessly carry context between AI conversations. Never lose your train of thought.",

  permissions: ["storage", "sidePanel", "alarms", "activeTab"],

  host_permissions: [
    "https://chat.openai.com/*",
    "https://chatgpt.com/*",
    "https://claude.ai/*",
    "https://gemini.google.com/*",
    "https://www.perplexity.ai/*",
    "https://grok.com/*",
    "https://x.com/grok*",
    "https://chat.deepseek.com/*",
    "https://chat.mistral.ai/*",
    "https://copilot.microsoft.com/*",
  ],

  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },

  content_scripts: [
    {
      matches: [
        "https://chat.openai.com/*",
        "https://chatgpt.com/*",
        "https://claude.ai/*",
        "https://gemini.google.com/*",
        "https://www.perplexity.ai/*",
        "https://grok.com/*",
        "https://x.com/grok*",
        "https://chat.deepseek.com/*",
        "https://chat.mistral.ai/*",
        "https://copilot.microsoft.com/*",
      ],
      js: ["src/content/index.ts"],
      run_at: "document_idle",
    },
  ],

  action: {
    default_popup: "src/popup/index.html",
    default_icon: {
      "16": "src/assets/icons/icon-16.png",
      "32": "src/assets/icons/icon-32.png",
      "48": "src/assets/icons/icon-48.png",
      "128": "src/assets/icons/icon-128.png",
    },
  },

  side_panel: {
    default_path: "src/sidepanel/index.html",
  },

  options_page: "src/options/index.html",

  icons: {
    "16": "src/assets/icons/icon-16.png",
    "32": "src/assets/icons/icon-32.png",
    "48": "src/assets/icons/icon-48.png",
    "128": "src/assets/icons/icon-128.png",
  },

  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self';",
  },
});
