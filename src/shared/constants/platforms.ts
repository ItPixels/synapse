import type { AIPlatform, PlatformConfig } from "@/shared/types";

export const PLATFORM_CONFIGS: Record<AIPlatform, PlatformConfig> = {
  chatgpt: {
    platform: "chatgpt",
    name: "ChatGPT",
    urlPatterns: [/^https:\/\/(chat\.openai\.com|chatgpt\.com)/],
    selectors: {
      messageContainer: ['[class*="react-scroll-to-bottom"]', "main .flex.flex-col"],
      userMessage: ['[data-message-author-role="user"]', ".agent-turn .whitespace-pre-wrap"],
      assistantMessage: ['[data-message-author-role="assistant"]', ".agent-turn .markdown"],
      conversationTitle: ["nav .bg-token-sidebar-surface-secondary", "nav a.flex"],
      inputField: ["#prompt-textarea", 'textarea[data-id="root"]'],
      sendButton: ['button[data-testid="send-button"]', 'button[aria-label="Send prompt"]'],
    },
  },

  claude: {
    platform: "claude",
    name: "Claude",
    urlPatterns: [/^https:\/\/claude\.ai/],
    selectors: {
      messageContainer: [".flex-1.flex.flex-col", '[class*="conversation"]'],
      userMessage: ['[data-testid="user-message"]', ".font-user-message"],
      assistantMessage: ['[data-testid="assistant-message"]', ".font-claude-message"],
      conversationTitle: ['[data-testid="chat-title"]', "header h1"],
      inputField: ['[contenteditable="true"]', ".ProseMirror"],
      sendButton: ['button[aria-label="Send Message"]', 'button[type="submit"]'],
    },
  },

  gemini: {
    platform: "gemini",
    name: "Gemini",
    urlPatterns: [/^https:\/\/gemini\.google\.com/],
    selectors: {
      messageContainer: [".conversation-container", "infinite-scroller"],
      userMessage: [".query-content", "user-query"],
      assistantMessage: [".response-content", "model-response"],
      conversationTitle: [".conversation-title", "h1.title"],
      inputField: [".ql-editor", 'rich-textarea [contenteditable="true"]'],
      sendButton: ['button[aria-label="Send message"]', ".send-button"],
    },
  },

  perplexity: {
    platform: "perplexity",
    name: "Perplexity",
    urlPatterns: [/^https:\/\/(www\.)?perplexity\.ai/],
    selectors: {
      messageContainer: [".pb-6", '[class*="ConversationMessages"]'],
      userMessage: ['[class*="Query"]', ".prose.dark\\:prose-invert"],
      assistantMessage: ['[class*="Answer"]', ".prose"],
      conversationTitle: ["h1", '[class*="ThreadTitle"]'],
      inputField: ["textarea", '[contenteditable="true"]'],
      sendButton: ['button[aria-label="Submit"]', 'button[type="submit"]'],
    },
  },

  grok: {
    platform: "grok",
    name: "Grok",
    urlPatterns: [/^https:\/\/(grok\.com|x\.com\/grok)/],
    selectors: {
      messageContainer: ['[class*="conversation"]', "main"],
      userMessage: ['[class*="user"]', '[data-role="user"]'],
      assistantMessage: ['[class*="assistant"]', '[data-role="assistant"]'],
      conversationTitle: ["h1", "header"],
      inputField: ["textarea", '[contenteditable="true"]'],
      sendButton: ['button[type="submit"]', 'button[aria-label="Send"]'],
    },
  },

  deepseek: {
    platform: "deepseek",
    name: "DeepSeek",
    urlPatterns: [/^https:\/\/chat\.deepseek\.com/],
    selectors: {
      messageContainer: [".dad65929", '[class*="chat-message"]'],
      userMessage: [".fbb737a4", '[class*="user"]'],
      assistantMessage: [".ds-markdown", '[class*="assistant"]'],
      conversationTitle: [".a5cdea51", "h1"],
      inputField: ["textarea", "#chat-input"],
      sendButton: ['[class*="send"]', 'button[type="submit"]'],
    },
  },

  mistral: {
    platform: "mistral",
    name: "Mistral",
    urlPatterns: [/^https:\/\/chat\.mistral\.ai/],
    selectors: {
      messageContainer: ['[class*="chat"]', "main"],
      userMessage: ['[class*="user"]', '[data-role="user"]'],
      assistantMessage: ['[class*="assistant"]', ".prose"],
      conversationTitle: ["h1", "header"],
      inputField: ["textarea", '[contenteditable="true"]'],
      sendButton: ['button[type="submit"]', 'button[aria-label="Send"]'],
    },
  },

  copilot: {
    platform: "copilot",
    name: "Copilot",
    urlPatterns: [/^https:\/\/copilot\.microsoft\.com/],
    selectors: {
      messageContainer: ['[class*="conversation"]', "#chat-messages"],
      userMessage: ['[class*="user-message"]', '[data-content="user"]'],
      assistantMessage: ['[class*="bot-message"]', '[data-content="bot"]'],
      conversationTitle: ["h1", "header"],
      inputField: ["textarea", "#searchbox"],
      sendButton: ['button[aria-label="Submit"]', 'button[type="submit"]'],
    },
  },
};

export const ALL_PLATFORMS = Object.keys(PLATFORM_CONFIGS) as AIPlatform[];
