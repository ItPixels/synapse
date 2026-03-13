import type { ContextCard as ContextCardType } from "@/shared/types";
import { cn } from "@/shared/utils/cn";

interface ContextCardProps {
  card: ContextCardType;
  onCopyPrompt: (prompt: string) => void;
}

export function ContextCard({ card, onCopyPrompt }: ContextCardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
      <p className="text-sm text-foreground leading-relaxed">{card.summary}</p>

      {card.keyPoints.length > 0 && (
        <ul className="text-xs text-muted space-y-1">
          {card.keyPoints.map((point) => (
            <li key={point} className="flex gap-1.5">
              <span className="text-primary shrink-0">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-1">
        {card.topics.map((topic) => (
          <span
            key={topic}
            className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium"
          >
            {topic}
          </span>
        ))}
        <span
          className={cn(
            "text-[10px] px-1.5 py-0.5 rounded font-medium",
            "bg-accent/10 text-accent",
          )}
        >
          {card.intent}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onCopyPrompt(card.generatedPrompt)}
        className="w-full text-xs py-1.5 rounded-md border border-border hover:bg-surface transition-colors text-center text-muted hover:text-foreground"
      >
        📋 Copy context prompt
      </button>
    </div>
  );
}
