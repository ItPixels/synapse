export type Plan = "free" | "pro" | "team";

export type SubscriptionStatus = "active" | "past_due" | "canceled" | "trialing";

export interface UsageInfo {
  conversationsThisMonth: number;
  summarizationsThisMonth: number;
  lastResetAt: number;
}

export interface Subscription {
  plan: Plan;
  status: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: number | null;
  usage: UsageInfo;
}
