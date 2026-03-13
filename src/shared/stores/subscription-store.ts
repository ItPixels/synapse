import { create } from "zustand";
import { fetchSubscription } from "@/shared/api/stripe";
import {
  cacheSubscription,
  canCapture,
  canSummarize,
  getCachedSubscription,
  getLimitsForPlan,
  getUsageInfo,
} from "@/shared/api/usage";
import type { Subscription, UsageInfo } from "@/shared/types";

interface SubscriptionState {
  subscription: Subscription;
  usage: UsageInfo;
  isLoading: boolean;

  /** Load subscription and usage from cache. */
  load: () => Promise<void>;
  /** Refresh subscription from server. */
  refresh: () => Promise<void>;
  /** Reload usage counters. */
  reloadUsage: () => Promise<void>;
  /** Check if user can capture. */
  canCapture: () => Promise<boolean>;
  /** Check if user can summarize. */
  canSummarize: () => Promise<boolean>;
  /** Get current plan limits. */
  getLimits: () => ReturnType<typeof getLimitsForPlan>;
}

const DEFAULT_USAGE: UsageInfo = {
  conversationsThisMonth: 0,
  summarizationsThisMonth: 0,
  lastResetAt: Date.now(),
};

const DEFAULT_SUBSCRIPTION: Subscription = {
  plan: "free",
  status: "active",
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  currentPeriodEnd: null,
  usage: DEFAULT_USAGE,
};

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscription: DEFAULT_SUBSCRIPTION,
  usage: DEFAULT_USAGE,
  isLoading: false,

  load: async () => {
    set({ isLoading: true });
    const [sub, usage] = await Promise.all([getCachedSubscription(), getUsageInfo()]);
    set({ subscription: sub, usage, isLoading: false });
  },

  refresh: async () => {
    set({ isLoading: true });
    const remote = await fetchSubscription();
    if (remote) {
      const usage = await getUsageInfo();
      const sub: Subscription = {
        plan: remote.plan,
        status: remote.status,
        stripeCustomerId: remote.stripeCustomerId,
        stripeSubscriptionId: remote.stripeSubscriptionId,
        currentPeriodEnd: remote.currentPeriodEnd,
        usage,
      };
      await cacheSubscription(sub);
      set({ subscription: sub, usage, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  reloadUsage: async () => {
    const usage = await getUsageInfo();
    set({ usage });
  },

  canCapture: () => canCapture(get().subscription.plan),
  canSummarize: () => canSummarize(get().subscription.plan),
  getLimits: () => getLimitsForPlan(get().subscription.plan),
}));
