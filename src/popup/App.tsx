import { useEffect, useState } from "react";
import { PLATFORM_CONFIGS } from "@/shared/constants/platforms";
import type { ConversationRecord } from "@/shared/db/dexie-schema";
import { useConversationStore } from "@/shared/stores/conversation-store";
import { useSettingsStore } from "@/shared/stores/settings-store";
import { Onboarding } from "./components/Onboarding";

export function App() {
  const { conversations, load } = useConversationStore();
  const { settings, load: loadSettings, update } = useSettingsStore();
  const [recentConvs, setRecentConvs] = useState<ConversationRecord[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    load();
    loadSettings();
    // Check if onboarding has been completed
    chrome.storage.local.get("synapse_onboarding_done", (result) => {
      if (!result.synapse_onboarding_done) {
        setShowOnboarding(true);
      }
    });
  }, [load, loadSettings]);

  useEffect(() => {
    setRecentConvs(conversations.slice(0, 3));
  }, [conversations]);

  const handleToggleCapture = () => {
    update({ autoCaptureEnabled: !settings.autoCaptureEnabled });
  };

  const totalToday = conversations.filter(
    (c) => Date.now() - c.updatedAt < 24 * 60 * 60 * 1000,
  ).length;

  if (showOnboarding) {
    return (
      <div className="w-80 bg-background text-foreground">
        <Onboarding onComplete={() => setShowOnboarding(false)} />
      </div>
    );
  }

  return (
    <div className="w-80 bg-background text-foreground">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧠</span>
            <h1 className="text-base font-semibold text-primary">Synapse</h1>
          </div>
          <button
            type="button"
            onClick={handleToggleCapture}
            className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
              settings.autoCaptureEnabled ? "bg-primary/10 text-primary" : "bg-surface text-muted"
            }`}
          >
            {settings.autoCaptureEnabled ? "● Active" : "○ Paused"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex justify-between text-xs">
          <div>
            <p className="text-muted">Today</p>
            <p className="text-lg font-semibold text-foreground">{totalToday}</p>
          </div>
          <div>
            <p className="text-muted">Total</p>
            <p className="text-lg font-semibold text-foreground">{conversations.length}</p>
          </div>
          <div>
            <p className="text-muted">Platforms</p>
            <p className="text-lg font-semibold text-foreground">
              {new Set(conversations.map((c) => c.platform)).size}
            </p>
          </div>
        </div>
      </div>

      {/* Recent conversations */}
      <div className="p-4">
        <p className="text-xs text-muted mb-2 font-medium">Recent</p>
        {recentConvs.length === 0 ? (
          <p className="text-xs text-muted text-center py-4">No conversations captured yet</p>
        ) : (
          <div className="space-y-2">
            {recentConvs.map((conv) => {
              const config = PLATFORM_CONFIGS[conv.platform];
              return (
                <div key={conv.id} className="p-2.5 rounded-lg bg-surface border border-border">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                      {config?.name ?? conv.platform}
                    </span>
                    <span className="text-[10px] text-muted">{conv.messageCount} msgs</span>
                  </div>
                  <p className="text-xs text-foreground truncate">{conv.title}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-3 flex gap-2">
        <button
          type="button"
          onClick={() => chrome.runtime.openOptionsPage()}
          className="flex-1 text-xs py-1.5 rounded-md border border-border text-muted hover:text-foreground hover:bg-surface transition-colors"
        >
          Settings
        </button>
        <button
          type="button"
          onClick={() => chrome.sidePanel?.open?.({ windowId: chrome.windows?.WINDOW_ID_CURRENT })}
          className="flex-1 text-xs py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Open Panel
        </button>
      </div>
    </div>
  );
}
