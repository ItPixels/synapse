/** Free tier limits */
export const FREE_LIMITS = {
  capturesPerMonth: 15,
  summarizationsPerMonth: 15,
  maxPlatforms: 3,
  cloudSync: false,
  maxHistoryDays: 7,
} as const;

/** Pro tier limits */
export const PRO_LIMITS = {
  capturesPerMonth: Infinity,
  summarizationsPerMonth: Infinity,
  maxPlatforms: Infinity,
  cloudSync: true,
  maxHistoryDays: 30,
} as const;

/** Rate limits */
export const RATE_LIMITS = {
  summarizationPerMinute: 10,
  captureDebounceMs: 3000,
  maxMessageLength: 50_000,
  maxMessagesForSummary: 30,
} as const;

/** Storage limits */
export const STORAGE_LIMITS = {
  indexedDbWarningMb: 100,
  indexedDbMaxMb: 200,
  rawMessageRetentionDays: 7,
} as const;
