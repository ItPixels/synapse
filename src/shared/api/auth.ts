import type { AuthError, Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export interface AuthResult {
  user: User | null;
  error: AuthError | null;
}

/**
 * Sign up with email and password.
 */
export async function signUp(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { user: data.user, error };
}

/**
 * Sign in with email and password.
 */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: data.user, error };
}

/**
 * Sign in with OAuth provider (Google, GitHub).
 */
export async function signInWithOAuth(
  provider: "google" | "github",
): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: chrome.identity.getRedirectURL(),
    },
  });
  return { error };
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get the current session (null if not signed in).
 */
export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Get the current user (null if not signed in).
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/**
 * Listen for auth state changes.
 */
export function onAuthStateChange(callback: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => data.subscription.unsubscribe();
}
