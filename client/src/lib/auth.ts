import { create } from "zustand";
import { persist } from "zustand/middleware";

// User type (without password)
export interface User {
  id: string;
  username: string;
  email: string;
  role: "customer" | "admin";
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  isAdmin: () => boolean;
  isAuthenticated: () => boolean;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user, error: null }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            set({ error: data.message || "Login failed", isLoading: false });
            return false;
          }

          set({ user: data.user, isLoading: false, error: null });
          return true;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Network error", 
            isLoading: false 
          });
          return false;
        }
      },

      register: async (username: string, email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            set({ error: data.message || "Registration failed", isLoading: false });
            return false;
          }

          set({ user: data.user, isLoading: false, error: null });
          return true;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Network error", 
            isLoading: false 
          });
          return false;
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/auth/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });

          if (!response.ok) {
            throw new Error("Logout failed");
          }

          set({ user: null, isLoading: false, error: null });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Logout failed", 
            isLoading: false 
          });
          // Clear user anyway even if logout failed
          set({ user: null });
        }
      },

      fetchCurrentUser: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/auth/me");
          const data = await response.json();

          if (response.ok && data.user) {
            set({ user: data.user, isLoading: false, error: null });
          } else {
            set({ user: null, isLoading: false, error: null });
          }
        } catch (error) {
          set({ user: null, isLoading: false, error: null });
        }
      },

      isAdmin: () => {
        const state = get();
        return state.user?.role === "admin";
      },

      isAuthenticated: () => {
        const state = get();
        return state.user !== null;
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user }),
    }
  )
);

