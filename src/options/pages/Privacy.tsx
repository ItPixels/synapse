import { useSettingsStore } from "@/shared/stores/settings-store";

export function Privacy() {
  const { settings, update } = useSettingsStore();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Data Storage</h3>
        <p className="text-xs text-muted mb-3">
          By default, all data stays on your device. Cloud sync is opt-in.
        </p>

        <label className="flex items-start gap-3 cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={settings.localOnly}
            onChange={(e) => update({ localOnly: e.target.checked })}
            className="mt-0.5 accent-primary"
          />
          <div>
            <p className="text-sm text-foreground">Local only mode</p>
            <p className="text-xs text-muted">
              Keep all data on this device. Nothing is sent to the cloud.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={settings.encryptLocal}
            onChange={(e) => update({ encryptLocal: e.target.checked })}
            className="mt-0.5 accent-primary"
          />
          <div>
            <p className="text-sm text-foreground">Encrypt local data</p>
            <p className="text-xs text-muted">
              Encrypt conversations stored in IndexedDB (Pro feature)
            </p>
          </div>
        </label>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Auto-delete</h3>
        <p className="text-xs text-muted mb-3">
          Automatically remove old conversations after a set period.
        </p>
        <select
          value={settings.autoDeleteDays ?? "never"}
          onChange={(e) =>
            update({ autoDeleteDays: e.target.value === "never" ? null : Number(e.target.value) })
          }
          className="px-2 py-1 text-sm rounded border border-border bg-surface text-foreground"
        >
          <option value="never">Never</option>
          <option value="7">After 7 days</option>
          <option value="14">After 14 days</option>
          <option value="30">After 30 days</option>
          <option value="90">After 90 days</option>
        </select>
      </div>

      <div className="p-3 rounded-lg bg-surface border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-2">What Synapse collects</h3>
        <ul className="text-xs text-muted space-y-1">
          <li className="text-success">✓ Text of your AI conversations (messages only)</li>
          <li className="text-error">✗ Cookies or auth tokens</li>
          <li className="text-error">✗ Browser history or metadata</li>
          <li className="text-error">✗ Data from other tabs or websites</li>
          <li className="text-error">✗ Any third-party analytics</li>
        </ul>
      </div>
    </div>
  );
}
