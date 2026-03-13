import { useSettingsStore } from "@/shared/stores/settings-store";

export function General() {
  const { settings, update } = useSettingsStore();

  return (
    <div className="space-y-6">
      <Section title="Capture">
        <Toggle
          label="Auto-capture conversations"
          description="Automatically capture messages when you chat with AI"
          checked={settings.autoCaptureEnabled}
          onChange={(v) => update({ autoCaptureEnabled: v })}
        />
        <NumberInput
          label="Minimum messages for capture"
          description="Only capture conversations with at least this many messages"
          value={settings.captureMinMessages}
          min={1}
          max={20}
          onChange={(v) => update({ captureMinMessages: v })}
        />
      </Section>

      <Section title="Suggestions">
        <Toggle
          label="Show suggestions"
          description="Show context suggestions when switching between AI platforms"
          checked={settings.suggestionsEnabled}
          onChange={(v) => update({ suggestionsEnabled: v })}
        />
        <Select
          label="Widget position"
          value={settings.suggestionsPosition}
          options={[
            { value: "bottom-right", label: "Bottom right" },
            { value: "top-right", label: "Top right" },
            { value: "sidebar", label: "Sidebar" },
          ]}
          onChange={(v) =>
            update({ suggestionsPosition: v as typeof settings.suggestionsPosition })
          }
        />
      </Section>

      <Section title="Appearance">
        <Select
          label="Theme"
          value={settings.theme}
          options={[
            { value: "system", label: "System" },
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ]}
          onChange={(v) => update({ theme: v as typeof settings.theme })}
        />
        <Select
          label="Summary quality"
          value={settings.summaryQuality}
          options={[
            { value: "brief", label: "Brief (faster, cheaper)" },
            { value: "detailed", label: "Detailed (richer context)" },
          ]}
          onChange={(v) => update({ summaryQuality: v as typeof settings.summaryQuality })}
        />
      </Section>
    </div>
  );
}

// --- Reusable form controls ---

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
      <div className="space-y-4 pl-1">{children}</div>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 accent-primary"
      />
      <div>
        <p className="text-sm text-foreground">{label}</p>
        <p className="text-xs text-muted">{description}</p>
      </div>
    </label>
  );
}

function NumberInput({
  label,
  description,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <p className="text-sm text-foreground">{label}</p>
      <p className="text-xs text-muted mb-1">{description}</p>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-20 px-2 py-1 text-sm rounded border border-border bg-surface text-foreground"
      />
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-sm text-foreground mb-1">{label}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-2 py-1 text-sm rounded border border-border bg-surface text-foreground"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
