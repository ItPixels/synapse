import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { getSession, onAuthStateChange, signIn, signOut, signUp } from "@/shared/api/auth";

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;

  /** Initialize auth state and subscribe to changes. */
  init: () => Promise<() => void>;
  /** Sign up with email/password. */
  signUp: (email: string, password: string) => Promise<boolean>;
  /** Sign in with email/password. */
  signIn: (email: string, password: string) => Promise<boolean>;
  /** Sign out. */
  signOut: () => Promise<void>;
  /** Clear any error message. */
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  error: null,

  init: async () => {
    set({ isLoading: true });
    const session = await getSession();
    set({
      session,
      user: session?.user ?? null,
      isLoading: false,
    });

    const unsubscribe = onAuthStateChange((newSession) => {
      set({
        session: newSession,
        user: newSession?.user ?? null,
      });
    });

    return unsubscribe;
  },

  signUp: async (email, password) => {
    set({ isLoading: true, error: null });
    const result = await signUp(email, password);
    if (result.error) {
      set({ isLoading: false, error: result.error.message });
      return false;
    }
    set({ user: result.user, isLoading: false });
    return true;
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    const result = await signIn(email, password);
    if (result.error) {
      set({ isLoading: false, error: result.error.message });
      return false;
    }
    set({ user: result.user, isLoading: false });
    return true;
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    const { error } = await signOut();
    if (error) {
      set({ isLoading: false, error: error.message });
      return;
    }
    set({ user: null, session: null, isLoading: false });
  },

  clearError: () => set({ error: null }),
}));
