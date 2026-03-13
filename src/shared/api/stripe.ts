import { supabase } from "./supabase";

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string;

/**
 * Create a Stripe Checkout session via Supabase Edge Function.
 * Returns the checkout URL to redirect the user.
 */
export async function createCheckoutSession(priceId: string): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke("create-checkout", {
    body: { priceId },
  });

  if (error) {
    // biome-ignore lint/suspicious/noConsole: error logging
    console.error("[Synapse] Checkout error:", error.message);
    return null;
  }

  return data?.url ?? null;
}

/**
 * Create a Stripe Customer Portal session via Supabase Edge Function.
 * Returns the portal URL for managing subscription.
 */
export async function createPortalSession(): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke("create-portal", {});

  if (error) {
    // biome-ignore lint/suspicious/noConsole: error logging
    console.error("[Synapse] Portal error:", error.message);
    return null;
  }

  return data?.url ?? null;
}

/**
 * Fetch current subscription status from Supabase.
 */
export async function fetchSubscription(): Promise<SubscriptionResponse | null> {
  const { data, error } = await supabase.functions.invoke("get-subscription", {});

  if (error) {
    // biome-ignore lint/suspicious/noConsole: error logging
    console.error("[Synapse] Subscription fetch error:", error.message);
    return null;
  }

  return data as SubscriptionResponse;
}

export interface SubscriptionResponse {
  plan: "free" | "pro" | "team";
  status: "active" | "past_due" | "canceled" | "trialing";
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: number | null;
}

/**
 * Check if Stripe is configured.
 */
export function isStripeConfigured(): boolean {
  return Boolean(STRIPE_PUBLISHABLE_KEY);
}
