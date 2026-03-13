import { useState } from "react";
import { PLATFORM_CONFIGS } from "@/shared/constants/platforms";
import { useSettingsStore } from "@/shared/stores/settings-store";
import type { AIPlatform } from "@/shared/types";
import { DEFAULT_SETTINGS } from "@/shared/types";

const STEPS = ["welcome", "platforms", "ready"] as const;
type Step = (typeof STEPS)[number];

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const { update } = useSettingsStore();
  const [step, setStep] = useState<Step>("welcome");
  const [selectedPlatforms, setSelectedPlatforms] = useState<AIPlatform[]>(
    DEFAULT_SETTINGS.enabledPlatforms,
  );

  const togglePlatform = (platform: AIPlatform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform],
    );
  };

  const handleFinish = async () => {
    await update({ enabledPlatforms: selectedPlatforms });
    await chrome.storage.local.set({ synapse_onboarding_done: true });
    onComplete();
  };

  return (
    <div className="p-4 space-y-4">
      {step === "welcome" && (
        <div className="text-center space-y-3">
          <div className="text-3xl">🧠</div>
          <h2 className="text-lg font-semibold text-primary">Welcome to Synapse</h2>
          <p className="text-xs text-muted leading-relaxed">
            Your AI Memory Bridge. Synapse captures conversations across AI platforms and helps you
            carry context seamlessly between them.
          </p>
          <button
            type="button"
            onClick={() => setStep("platforms")}
            className="w-full text-sm px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            Get started
          </button>
        </div>
      )}

      {step === "platforms" && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Choose your AI platforms</h2>
          <p className="text-xs text-muted">
            Select the platforms you use. You can change this later.
          </p>

          <div className="grid grid-cols-2 gap-2">
            {(
              Object.entries(PLATFORM_CONFIGS) as [
                AIPlatform,
                (typeof PLATFORM_CONFIGS)[AIPlatform],
              ][]
            ).map(([key, config]) => (
              <button
                key={key}
                type="button"
                onClick={() => togglePlatform(key)}
                className={`text-xs px-3 py-2 rounded-lg border transition-colors text-left ${
                  selectedPlatforms.includes(key)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted hover:text-foreground"
                }`}
              >
                {config.name}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setStep("ready")}
            disabled={selectedPlatforms.length === 0}
            className="w-full text-sm px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      )}

      {step === "ready" && (
        <div className="text-center space-y-3">
          <div className="text-3xl">🚀</div>
          <h2 className="text-sm font-semibold text-foreground">You're all set!</h2>
          <p className="text-xs text-muted leading-relaxed">
            Synapse will now capture your conversations in the background. When you switch between
            AI platforms, you'll see relevant context suggestions.
          </p>
          <div className="text-xs text-muted space-y-1 text-left bg-surface rounded-lg p-3">
            <p>How it works:</p>
            <p>1. Chat normally on any AI platform</p>
            <p>2. Synapse captures & summarizes automatically</p>
            <p>3. Switch platforms — get context suggestions</p>
          </div>
          <button
            type="button"
            onClick={handleFinish}
            className="w-full text-sm px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            Start using Synapse
          </button>
        </div>
      )}
    </div>
  );
}
