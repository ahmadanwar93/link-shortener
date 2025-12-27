import type { User } from "better-auth";
import { create } from "zustand";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // the flow for isLoading: App starts → isLoading: true → Check session with backend → isLoading: false
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}
// for now, i deprecate zustand first until further use case
// for auth, i am using useAuth hook to reduce redundancy

// zustand is a module level singleton store with reactive subscriptions
// zustand store would contains state (data) and actions (mutation)
export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  // for the set function, we just pass in the partial state that we want to update
  // we dont have to spread the old state first before merging
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: user !== null }),
  setLoading: (isLoading) => set({ isLoading }),
  clearAuth: () => set({ user: null, isAuthenticated: false }),
}));
