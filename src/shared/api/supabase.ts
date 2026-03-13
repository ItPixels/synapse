import { createClient } from "@supabase/supabase-js";
import type { Database } from "./supabase-types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // biome-ignore lint/suspicious/noConsole: startup warning
  console.warn("[Synapse] Supabase credentials not configured — cloud sync disabled");
}

export const supabase = createClient<Database>(SUPABASE_URL ?? "", SUPABASE_ANON_KEY ?? "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: {
      getItem: (key) =>
        new Promise((resolve) => {
          chrome.storage.local.get(key, (result) => resolve(result[key] ?? null));
        }),
      setItem: (key, value) =>
        new Promise<void>((resolve) => {
          chrome.storage.local.set({ [key]: value }, resolve);
        }),
      removeItem: (key) =>
        new Promise<void>((resolve) => {
          chrome.storage.local.remove(key, resolve);
        }),
    },
  },
});
