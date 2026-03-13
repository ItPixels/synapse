import { PLATFORM_CONFIGS } from "@/shared/constants/platforms";
import type { ConversationRecord } from "@/shared/db/dexie-schema";
import { cn } from "@/shared/utils/cn";

interface ConversationListProps {
  conversations: ConversationRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted text-sm">
        <p className="text-2xl mb-2">🧠</p>
        <p>No conversations yet</p>
        <p className="text-xs mt-1">Start chatting with any AI platform</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map((conv) => {
        const config = PLATFORM_CONFIGS[conv.platform];
        const timeAgo = formatTimeAgo(conv.updatedAt);
        const isSelected = conv.id === selectedId;

        return (
          <button
            key={conv.id}
            type="button"
            onClick={() => onSelect(conv.id)}
            className={cn(
              "w-full text-left p-3 rounded-lg transition-colors",
              "hover:bg-surface",
              isSelected && "bg-surface border border-primary/30",
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                {config?.name ?? conv.platform}
              </span>
              <span className="text-[10px] text-muted ml-auto">{timeAgo}</span>
            </div>
            <p className="text-sm font-medium text-foreground truncate">{conv.title}</p>
            <p className="text-xs text-muted mt-0.5">{conv.messageCount} messages</p>
          </button>
        );
      })}
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
