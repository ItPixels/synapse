import { useEffect, useState } from "react";
import { type SyncResult, syncAll } from "@/shared/api/sync";
import { useAuthStore } from "@/shared/stores/auth-store";

export function Account() {
  const { user, isLoading, error, signIn, signUp, signOut, clearError, init } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const cleanup = init();
    return () => {
      cleanup.then((unsub) => unsub());
    };
  }, [init]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success =
      mode === "signin" ? await signIn(email, password) : await signUp(email, password);
    if (success) {
      setEmail("");
      setPassword("");
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    const result = await syncAll();
    setSyncResult(result);
    setIsSyncing(false);
  };

  if (user) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">Account</h3>
          <p className="text-xs text-muted mb-3">
            Signed in as <span className="text-foreground font-medium">{user.email}</span>
          </p>
          <button
            type="button"
            onClick={signOut}
            disabled={isLoading}
            className="text-sm px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface transition-colors disabled:opacity-50"
          >
            {isLoading ? "Signing out..." : "Sign out"}
          </button>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">Cloud Sync</h3>
          <p className="text-xs text-muted mb-3">
            Sync your conversations and context cards across devices.
          </p>
          <button
            type="button"
            onClick={handleSync}
            disabled={isSyncing}
            className="text-sm px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSyncing ? "Syncing..." : "Sync now"}
          </button>

          {syncResult && (
            <div className="mt-3 text-xs space-y-1">
              <p className="text-foreground">
                Pushed: {syncResult.pushed} | Pulled: {syncResult.pulled}
              </p>
              {syncResult.errors.length > 0 && (
                <div className="text-error">
                  {syncResult.errors.map((err) => (
                    <p key={err}>{err}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {error && <p className="text-xs text-error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">
          {mode === "signin" ? "Sign In" : "Create Account"}
        </h3>
        <p className="text-xs text-muted mb-4">Sign in to enable cloud sync across your devices.</p>

        <form onSubmit={handleSubmit} className="space-y-3 max-w-xs">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-surface text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-surface text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
          />

          {error && <p className="text-xs text-error">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full text-sm px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Loading..." : mode === "signin" ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            clearError();
          }}
          className="mt-3 text-xs text-primary hover:underline"
        >
          {mode === "signin"
            ? "Don't have an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
