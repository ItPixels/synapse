import { useEffect, useState } from "react";
import { createCheckoutSession, createPortalSession } from "@/shared/api/stripe";
import { getLimitsForPlan } from "@/shared/api/usage";
import { useAuthStore } from "@/shared/stores/auth-store";
import { useSubscriptionStore } from "@/shared/stores/subscription-store";

const PRO_PRICE_ID = "price_synapse_pro_monthly"; // Replace with actual Stripe price ID

export function Subscription() {
  const { user } = useAuthStore();
  const { subscription, usage, isLoading, load, refresh } = useSubscriptionStore();
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    load();
  }, [load]);

  const limits = getLimitsForPlan(subscription.plan);
  const isPro = subscription.plan === "pro" || subscription.plan === "team";

  const handleUpgrade = async () => {
    setActionLoading(true);
    const url = await createCheckoutSession(PRO_PRICE_ID);
    if (url) {
      chrome.tabs.create({ url });
    }
    setActionLoading(false);
  };

  const handleManage = async () => {
    setActionLoading(true);
    const url = await createPortalSession();
    if (url) {
      chrome.tabs.create({ url });
    }
    setActionLoading(false);
  };

  if (!user) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Subscription</h3>
        <p className="text-xs text-muted">
          Sign in on the Account tab to manage your subscription.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current plan */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Current Plan</h3>
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded ${
              isPro ? "bg-primary/20 text-primary" : "bg-surface text-muted"
            }`}
          >
            {subscription.plan.toUpperCase()}
          </span>
          {subscription.status !== "active" && (
            <span className="text-xs text-error">{subscription.status}</span>
          )}
        </div>

        {isPro && subscription.currentPeriodEnd && (
          <p className="text-xs text-muted">
            Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Usage */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Usage This Month</h3>
        <div className="space-y-2">
          <UsageBar
            label="Captures"
            used={usage.conversationsThisMonth}
            limit={limits.capturesPerMonth}
          />
          <UsageBar
            label="Summarizations"
            used={usage.summarizationsThisMonth}
            limit={limits.summarizationsPerMonth}
          />
        </div>
      </div>

      {/* Actions */}
      <div>
        {isPro ? (
          <button
            type="button"
            onClick={handleManage}
            disabled={actionLoading}
            className="text-sm px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface transition-colors disabled:opacity-50"
          >
            {actionLoading ? "Loading..." : "Manage Subscription"}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
              <h4 className="text-sm font-semibold text-primary mb-2">Upgrade to Pro</h4>
              <ul className="text-xs text-muted space-y-1 mb-3">
                <li>Unlimited captures & summarizations</li>
                <li>All 8 AI platforms</li>
                <li>Cloud sync across devices</li>
                <li>30-day history</li>
              </ul>
              <button
                type="button"
                onClick={handleUpgrade}
                disabled={actionLoading}
                className="text-sm px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Loading..." : "Upgrade — $9/month"}
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={refresh}
          disabled={isLoading}
          className="mt-3 text-xs text-primary hover:underline disabled:opacity-50"
        >
          {isLoading ? "Refreshing..." : "Refresh subscription status"}
        </button>
      </div>
    </div>
  );
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const isUnlimited = !Number.isFinite(limit);
  const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
  const isNearLimit = !isUnlimited && percentage >= 80;

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-foreground">{label}</span>
        <span className={isNearLimit ? "text-error" : "text-muted"}>
          {used} / {isUnlimited ? "Unlimited" : limit}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-1.5 bg-surface rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isNearLimit ? "bg-error" : "bg-primary"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}
