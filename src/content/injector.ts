import type { SuggestionPayload } from "@/shared/messaging/types";

const WIDGET_ID = "synapse-floating-widget";

/**
 * Inject or update the floating suggestion widget on the AI platform page.
 */
export function showSuggestionWidget(suggestions: SuggestionPayload[]): void {
  let container = document.getElementById(WIDGET_ID);

  if (!container) {
    container = document.createElement("div");
    container.id = WIDGET_ID;
    document.body.appendChild(container);
  }

  container.innerHTML = "";

  const shadow = container.attachShadow?.({ mode: "closed" }) ?? container;
  const wrapper = document.createElement("div");

  // Inject styles into shadow DOM
  const style = document.createElement("style");
  style.textContent = getWidgetStyles();
  shadow.appendChild(style);
  shadow.appendChild(wrapper);

  wrapper.className = "synapse-widget";
  wrapper.innerHTML = buildWidgetHTML(suggestions);

  // Attach event listeners
  attachWidgetEvents(wrapper, suggestions);
}

/**
 * Remove the floating widget.
 */
export function hideSuggestionWidget(): void {
  document.getElementById(WIDGET_ID)?.remove();
}

function buildWidgetHTML(suggestions: SuggestionPayload[]): string {
  const cards = suggestions
    .map((s, i) => {
      const platformBadges = s.platforms
        .map((p) => `<span class="synapse-badge">${p}</span>`)
        .join(" ");

      const hasRelated = s.relatedCards.length > 0;
      const relatedLabel = hasRelated
        ? `<span class="synapse-merged">⚡ ${s.relatedCards.length + 1} conversations merged</span>`
        : "";

      return `
        <div class="synapse-card" data-index="${i}">
          <div class="synapse-card-header">
            ${platformBadges}
            ${relatedLabel}
          </div>
          <div class="synapse-card-summary">${escapeHtml(s.card.summary)}</div>
          <div class="synapse-card-actions">
            <button class="synapse-btn synapse-btn-copy" data-index="${i}" title="Copy prompt to clipboard">
              📋 Copy prompt
            </button>
            <button class="synapse-btn synapse-btn-insert" data-index="${i}" title="Insert into input field">
              ▶ Insert
            </button>
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="synapse-header">
      <div class="synapse-title">🧠 Synapse</div>
      <button class="synapse-close" title="Dismiss">×</button>
    </div>
    <div class="synapse-body">
      ${cards}
    </div>
  `;
}

function attachWidgetEvents(wrapper: Element, suggestions: SuggestionPayload[]): void {
  // Close button
  wrapper.querySelector(".synapse-close")?.addEventListener("click", () => {
    hideSuggestionWidget();
  });

  // Copy buttons
  for (const btn of wrapper.querySelectorAll(".synapse-btn-copy")) {
    btn.addEventListener("click", (e) => {
      const index = Number((e.currentTarget as HTMLElement).dataset.index);
      const suggestion = suggestions[index];
      if (!suggestion) return;

      navigator.clipboard.writeText(suggestion.mergedPrompt);
      (e.currentTarget as HTMLElement).textContent = "✓ Copied!";
      setTimeout(() => {
        (e.currentTarget as HTMLElement).textContent = "📋 Copy prompt";
      }, 2000);
    });
  }

  // Insert buttons
  for (const btn of wrapper.querySelectorAll(".synapse-btn-insert")) {
    btn.addEventListener("click", (e) => {
      const index = Number((e.currentTarget as HTMLElement).dataset.index);
      const suggestion = suggestions[index];
      if (!suggestion) return;

      // Try to insert into the AI platform's input field
      const inserted = tryInsertIntoInput(suggestion.mergedPrompt);
      if (inserted) {
        (e.currentTarget as HTMLElement).textContent = "✓ Inserted!";
        setTimeout(() => hideSuggestionWidget(), 1500);
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(suggestion.mergedPrompt);
        (e.currentTarget as HTMLElement).textContent = "📋 Copied (paste manually)";
        setTimeout(() => {
          (e.currentTarget as HTMLElement).textContent = "▶ Insert";
        }, 2000);
      }
    });
  }
}

function tryInsertIntoInput(text: string): boolean {
  // Try common input selectors across AI platforms
  const selectors = [
    "#prompt-textarea",
    'textarea[data-id="root"]',
    '[contenteditable="true"]',
    ".ProseMirror",
    ".ql-editor",
    "textarea",
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (!el) continue;

    if (el instanceof HTMLTextAreaElement) {
      el.value = text;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.focus();
      return true;
    }

    if (el.getAttribute("contenteditable") === "true") {
      const p = el.querySelector("p");
      if (p) {
        p.textContent = text;
      } else {
        el.textContent = text;
      }
      el.dispatchEvent(new Event("input", { bubbles: true }));
      (el as HTMLElement).focus();
      return true;
    }
  }

  return false;
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function getWidgetStyles(): string {
  return `
    .synapse-widget {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 360px;
      max-height: 480px;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      color: #f1f5f9;
      z-index: 2147483647;
      overflow: hidden;
      animation: synapse-slide-in 0.3s ease-out;
    }

    @media (prefers-color-scheme: light) {
      .synapse-widget {
        background: #ffffff;
        border-color: #e2e8f0;
        color: #0f172a;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      }
      .synapse-card {
        background: #f8fafc !important;
        border-color: #e2e8f0 !important;
      }
      .synapse-header {
        border-color: #e2e8f0 !important;
      }
      .synapse-badge {
        background: #e0e7ff !important;
        color: #4338ca !important;
      }
      .synapse-btn {
        background: #f1f5f9 !important;
        color: #334155 !important;
        border-color: #e2e8f0 !important;
      }
      .synapse-btn:hover {
        background: #e2e8f0 !important;
      }
      .synapse-card-summary {
        color: #475569 !important;
      }
    }

    @keyframes synapse-slide-in {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .synapse-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #334155;
    }

    .synapse-title {
      font-weight: 600;
      font-size: 15px;
      color: #6366f1;
    }

    .synapse-close {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 20px;
      line-height: 1;
      padding: 0 4px;
    }
    .synapse-close:hover { color: #f1f5f9; }

    .synapse-body {
      padding: 12px;
      overflow-y: auto;
      max-height: 400px;
    }

    .synapse-card {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 8px;
    }
    .synapse-card:last-child { margin-bottom: 0; }

    .synapse-card-header {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }

    .synapse-badge {
      display: inline-block;
      background: #312e81;
      color: #a5b4fc;
      font-size: 11px;
      font-weight: 500;
      padding: 2px 8px;
      border-radius: 4px;
      text-transform: capitalize;
    }

    .synapse-merged {
      font-size: 11px;
      color: #06b6d4;
      font-weight: 500;
    }

    .synapse-card-summary {
      color: #94a3b8;
      font-size: 13px;
      line-height: 1.4;
      margin-bottom: 10px;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .synapse-card-actions {
      display: flex;
      gap: 8px;
    }

    .synapse-btn {
      flex: 1;
      background: #1e293b;
      border: 1px solid #334155;
      color: #e2e8f0;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      transition: background 0.15s;
    }
    .synapse-btn:hover {
      background: #334155;
    }
    .synapse-btn-insert {
      background: #4338ca;
      border-color: #4338ca;
      color: white;
    }
    .synapse-btn-insert:hover {
      background: #3730a3;
    }
  `;
}
