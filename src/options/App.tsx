import { useEffect, useState } from "react";
import { useSettingsStore } from "@/shared/stores/settings-store";
import { Account } from "./pages/Account";
import { DataManagement } from "./pages/DataManagement";
import { General } from "./pages/General";
import { Platforms } from "./pages/Platforms";
import { Privacy } from "./pages/Privacy";
import { Subscription } from "./pages/Subscription";

const TABS = ["General", "Platforms", "Privacy", "Data", "Account", "Plan"] as const;
type Tab = (typeof TABS)[number];

export function App() {
  const { load, isLoaded } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<Tab>("General");

  useEffect(() => {
    load();
  }, [load]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto py-8 px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-primary flex items-center gap-2">
            🧠 Synapse Settings
          </h1>
          <p className="text-sm text-muted mt-1">Configure your AI Memory Bridge</p>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 mb-8 border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "General" && <General />}
        {activeTab === "Platforms" && <Platforms />}
        {activeTab === "Privacy" && <Privacy />}
        {activeTab === "Data" && <DataManagement />}
        {activeTab === "Account" && <Account />}
        {activeTab === "Plan" && <Subscription />}
      </div>
    </div>
  );
}
