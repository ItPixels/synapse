import { create } from "zustand";
import type { UserSettings } from "@/shared/types";
import { DEFAULT_SETTINGS } from "@/shared/types";

const STORAGE_KEY = "synapse_settings";

interface SettingsState {
  settings: UserSettings;
  isLoaded: boolean;

  load: () => Promise<void>;
  update: (partial: Partial<UserSettings>) => Promise<void>;
  reset: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoaded: false,

  load: async () => {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const saved = result[STORAGE_KEY] as Partial<UserSettings> | undefined;
    if (saved) {
      set({ settings: { ...DEFAULT_SETTINGS, ...saved }, isLoaded: true });
    } else {
      set({ isLoaded: true });
    }
  },

  update: async (partial) => {
    const newSettings = { ...get().settings, ...partial };
    await chrome.storage.local.set({ [STORAGE_KEY]: newSettings });
    set({ settings: newSettings });
  },

  reset: async () => {
    await chrome.storage.local.remove(STORAGE_KEY);
    set({ settings: DEFAULT_SETTINGS });
  },
}));
