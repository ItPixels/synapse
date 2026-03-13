import { useEffect, useState } from "react";
import { useConversationStore } from "@/shared/stores/conversation-store";
import type { ContextCard as ContextCardType } from "@/shared/types";
import { ContextCard } from "./components/ContextCard";
import { ConversationList } from "./components/ConversationList";
import { SearchBar } from "./components/SearchBar";

export function App() {
  const { conversations, selectedId, searchQuery, isLoading, load, select, setSearch } =
    useConversationStore();

  const [selectedCard, setSelectedCard] = useState<ContextCardType | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedCard(null);
      return;
    }
    useConversationStore
      .getState()
      .getContextCard(selectedId)
      .then((card) => {
        setSelectedCard(card ?? null);
      });
  }, [selectedId]);

  const filtered = searchQuery
    ? conversations.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.platform.includes(searchQuery.toLowerCase()) ||
          c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
          c.autoTags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    : conversations;

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-primary">🧠 Synapse</h1>
          <span className="text-[10px] text-muted">{conversations.length} conversations</span>
        </div>
        <SearchBar value={searchQuery} onChange={setSearch} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted text-sm">
            Loading...
          </div>
        ) : (
          <div className="p-2">
            {/* Selected conversation detail */}
            {selectedId && selectedCard && (
              <div className="mb-4 p-3">
                <button
                  type="button"
                  onClick={() => select(null)}
                  className="text-xs text-muted hover:text-foreground mb-2 flex items-center gap-1"
                >
                  ← Back to list
                </button>
                <ContextCard card={selectedCard} onCopyPrompt={handleCopyPrompt} />
                {copyFeedback && (
                  <p className="text-xs text-success text-center mt-2">Copied to clipboard!</p>
                )}
              </div>
            )}

            {/* Conversation list */}
            {!selectedId && (
              <ConversationList
                conversations={filtered}
                selectedId={selectedId}
                onSelect={select}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
