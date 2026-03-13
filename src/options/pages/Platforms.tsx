import { PLATFORM_CONFIGS } from "@/shared/constants/platforms";
import { useSettingsStore } from "@/shared/stores/settings-store";
import type { AIPlatform } from "@/shared/types";

export function Platforms() {
  const { settings, update } = useSettingsStore();

  const togglePlatform = (platform: AIPlatform) => {
    const current = settings.enabledPlatforms;
    const updated = current.includes(platform)
      ? current.filter((p) => p !== platform)
      : [...current, platform];
    update({ enabledPlatforms: updated });
  };

  return (
    <div>
      <p className="text-sm text-muted mb-4">
        Choose which AI platforms Synapse monitors for conversations.
      </p>
      <div className="space-y-2">
        {Object.values(PLATFORM_CONFIGS).map((config) => {
          const enabled = settings.enabledPlatforms.includes(config.platform);
          return (
            <label
              key={config.platform}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-surface cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={enabled}
                onChange={() => togglePlatform(config.platform)}
                className="accent-primary"
              />
              <div>
                <p className="text-sm font-medium text-foreground">{config.name}</p>
                <p className="text-xs text-muted">
                  {config.urlPatterns
                    .map((p) => p.source.replace(/^\^https:\\\/\\\//, "").replace(/\\/, ""))
                    .join(", ")}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
