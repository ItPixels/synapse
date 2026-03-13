import { FREE_LIMITS, PRO_LIMITS } from "@/shared/constants/limits";
import type { Plan, Subscription, UsageInfo } from "@/shared/types";

const USAGE_STORAGE_KEY = "synapse_usage";
const SUBSCRIPTION_STORAGE_KEY = "synapse_subscription";

/**
 * Get the limits for a given plan.
 */
export function getLimitsForPlan(plan: Plan) {
  switch (plan) {
    case "pro":
    case "team":
      return PRO_LIMITS;
    default:
      return FREE_LIMITS;
  }
}

/**
 * Load usage info from chrome.storage.local.
 */
export async function getUsageInfo(): Promise<UsageInfo> {
  return new Promise((resolve) => {
    chrome.storage.local.get(USAGE_STORAGE_KEY, (result) => {
      const usage = result[USAGE_STORAGE_KEY] as UsageInfo | undefined;
      if (usage) {
        // Auto-reset if month has changed
        const now = new Date();
        const lastReset = new Date(usage.lastResetAt);
        if (
          now.getMonth() !== lastReset.getMonth() ||
          now.getFullYear() !== lastReset.getFullYear()
        ) {
          const fresh: UsageInfo = {
            conversationsThisMonth: 0,
            summarizationsThisMonth: 0,
            lastResetAt: Date.now(),
          };
          chrome.storage.local.set({ [USAGE_STORAGE_KEY]: fresh });
          resolve(fresh);
          return;
        }
        resolve(usage);
      } else {
        const fresh: UsageInfo = {
          conversationsThisMonth: 0,
          summarizationsThisMonth: 0,
          lastResetAt: Date.now(),
        };
        chrome.storage.local.set({ [USAGE_STORAGE_KEY]: fresh });
        resolve(fresh);
      }
    });
  });
}

/**
 * Increment capture usage counter.
 */
export async function incrementCaptureUsage(): Promise<UsageInfo> {
  const usage = await getUsageInfo();
  usage.conversationsThisMonth++;
  await saveUsage(usage);
  return usage;
}

/**
 * Increment summarization usage counter.
 */
export async function incrementSummarizationUsage(): Promise<UsageInfo> {
  const usage = await getUsageInfo();
  usage.summarizationsThisMonth++;
  await saveUsage(usage);
  return usage;
}

/**
 * Check if the user can capture more conversations.
 */
export async function canCapture(plan: Plan): Promise<boolean> {
  const usage = await getUsageInfo();
  const limits = getLimitsForPlan(plan);
  return usage.conversationsThisMonth < limits.capturesPerMonth;
}

/**
 * Check if the user can summarize more conversations.
 */
export async function canSummarize(plan: Plan): Promise<boolean> {
  const usage = await getUsageInfo();
  const limits = getLimitsForPlan(plan);
  return usage.summarizationsThisMonth < limits.summarizationsPerMonth;
}

/**
 * Save usage info to chrome.storage.local.
 */
async function saveUsage(usage: UsageInfo): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [USAGE_STORAGE_KEY]: usage }, resolve);
  });
}

/**
 * Load subscription from chrome.storage.local (cached).
 */
export async function getCachedSubscription(): Promise<Subscription> {
  return new Promise((resolve) => {
    chrome.storage.local.get(SUBSCRIPTION_STORAGE_KEY, (result) => {
      const sub = result[SUBSCRIPTION_STORAGE_KEY] as Subscription | undefined;
      resolve(
        sub ?? {
          plan: "free",
          status: "active",
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          currentPeriodEnd: null,
          usage: {
            conversationsThisMonth: 0,
            summarizationsThisMonth: 0,
            lastResetAt: Date.now(),
          },
        },
      );
    });
  });
}

/**
 * Cache subscription data locally.
 */
export async function cacheSubscription(sub: Subscription): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [SUBSCRIPTION_STORAGE_KEY]: sub }, resolve);
  });
}
