import { getCachedSubscription, getLimitsForPlan } from "@/shared/api/usage";
import { STORAGE_LIMITS } from "@/shared/constants/limits";
import { db } from "@/shared/db/dexie-schema";

const ALARM_CLEANUP = "synapse-cleanup";
const ALARM_SYNC = "synapse-sync";

/**
 * Set up periodic alarms for cleanup and sync tasks.
 */
export function initAlarms(): void {
  // Run cleanup every 6 hours
  chrome.alarms.create(ALARM_CLEANUP, { periodInMinutes: 360 });

  // Run sync check every 30 minutes (for pro users)
  chrome.alarms.create(ALARM_SYNC, { periodInMinutes: 30 });

  chrome.alarms.onAlarm.addListener((alarm) => {
    switch (alarm.name) {
      case ALARM_CLEANUP:
        runCleanup();
        break;
      case ALARM_SYNC:
        runSyncCheck();
        break;
    }
  });

  // Run cleanup on startup too
  runCleanup();
}

/**
 * Clean up old raw messages and expired data.
 */
async function runCleanup(): Promise<void> {
  const sub = await getCachedSubscription();
  const limits = getLimitsForPlan(sub.plan);
  const maxAgeDays = limits.maxHistoryDays;
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;

  // Delete conversations older than plan's history limit
  const oldConvs = await db.conversations.where("updatedAt").below(cutoff).toArray();

  for (const conv of oldConvs) {
    await db.contextCards.where("conversationId").equals(conv.id).delete();
    await db.conversations.delete(conv.id);
  }

  if (oldConvs.length > 0) {
    // biome-ignore lint/suspicious/noConsole: cleanup logging
    console.log(`[Synapse] Cleaned up ${oldConvs.length} old conversations`);
  }

  // Delete raw messages older than retention period to save space
  const rawCutoff = Date.now() - STORAGE_LIMITS.rawMessageRetentionDays * 24 * 60 * 60 * 1000;
  const convsToClear = await db.conversations.where("updatedAt").below(rawCutoff).toArray();

  for (const conv of convsToClear) {
    // Keep the conversation record but clear raw messages
    if (conv.messages.length > 0 && conv.contextCardId) {
      await db.conversations.update(conv.id, {
        messages: [],
        tokenEstimate: 0,
      });
    }
  }
}

/**
 * Check if auto-sync should run (pro users only).
 */
async function runSyncCheck(): Promise<void> {
  const sub = await getCachedSubscription();
  if (sub.plan === "free") return;

  // Dynamic import to avoid loading sync code for free users
  const { syncAll } = await import("@/shared/api/sync");
  const result = await syncAll();

  if (result.pushed > 0 || result.pulled > 0) {
    // biome-ignore lint/suspicious/noConsole: sync logging
    console.log(`[Synapse] Auto-sync: pushed ${result.pushed}, pulled ${result.pulled}`);
  }
}
