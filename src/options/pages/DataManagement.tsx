import { useState } from "react";
import { db } from "@/shared/db/dexie-schema";
import { clearAllData, getAllConversations } from "@/shared/db/operations";
import { useConversationStore } from "@/shared/stores/conversation-store";

export function DataManagement() {
  const { load } = useConversationStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const handleExportJSON = async () => {
    setExportStatus("Exporting...");
    const conversations = await getAllConversations(9999);
    const cards = await db.contextCards.toArray();

    const data = { conversations, contextCards: cards, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `synapse-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setExportStatus("Exported!");
    setTimeout(() => setExportStatus(null), 2000);
  };

  const handleDeleteAll = async () => {
    await clearAllData();
    await load();
    setConfirmDelete(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Export Data</h3>
        <p className="text-xs text-muted mb-3">
          Download all your conversations and context cards.
        </p>
        <button
          type="button"
          onClick={handleExportJSON}
          className="text-sm px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface transition-colors"
        >
          {exportStatus ?? "Export as JSON"}
        </button>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-error mb-1">Delete All Data</h3>
        <p className="text-xs text-muted mb-3">
          Permanently remove all conversations and context cards from this device.
        </p>
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="text-sm px-4 py-2 rounded-lg border border-error/30 text-error hover:bg-error/10 transition-colors"
          >
            Delete all data
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDeleteAll}
              className="text-sm px-4 py-2 rounded-lg bg-error text-white hover:bg-error/90 transition-colors"
            >
              Yes, delete everything
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="text-sm px-4 py-2 rounded-lg border border-border text-muted hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
