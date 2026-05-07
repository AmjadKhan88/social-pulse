// src/store/auth.store.ts
"use client";

import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import type { AuthUser } from "@/types";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: true,

        setAuth: (user, accessToken) =>
          set({ user, accessToken, isAuthenticated: true, isLoading: false }),

        clearAuth: () =>
          set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false }),

        updateUser: (updates) =>
          set((state) => ({
            user: state.user ? { ...state.user, ...updates } : null,
          })),

        setLoading: (isLoading) => set({ isLoading }),
      }),
      {
        name: "socialsphere-auth",
        // Only persist minimal info
        partialize: (state) => ({
          user: state.user,
          accessToken: state.accessToken,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    )
  )
);
