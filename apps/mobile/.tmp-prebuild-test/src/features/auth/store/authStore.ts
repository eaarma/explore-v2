// src/features/auth/store/authStore.ts

import { create } from "zustand";
import {
  AuthStatus,
  AuthUser,
} from "@/src/features/auth/types/authTypes";
import { clearHydratedUserProgress } from "@/src/features/discoveries/storage/discoveryCache";
import {
  clearAuthSession,
  saveAuthSession,
} from "@/src/shared/storage/tokenStorage";

type AuthenticatedStatus =
  | "authenticated-online"
  | "authenticated-offline";

type AuthState = {
  user: AuthUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  setSession: (user: AuthUser, accessToken: string) => Promise<void>;
  restoreSession: (user: AuthUser, status: AuthenticatedStatus) => void;
  setChecking: () => void;
  setUnauthenticated: () => void;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: "checking",
  isAuthenticated: false,

  setSession: async (user, accessToken) => {
    await saveAuthSession(accessToken, user);

    set({
      user,
      status: "authenticated-online",
      isAuthenticated: true,
    });
  },

  restoreSession: (user, status) => {
    set({
      user,
      status,
      isAuthenticated: true,
    });
  },

  setChecking: () => {
    set((state) => ({
      user: state.user,
      status: "checking",
      isAuthenticated: state.isAuthenticated,
    }));
  },

  setUnauthenticated: () => {
    set({
      user: null,
      status: "unauthenticated",
      isAuthenticated: false,
    });
  },

  logout: async () => {
    const currentUserId = get().user?.id ?? "";

    if (currentUserId) {
      await clearHydratedUserProgress(currentUserId);
    }

    await clearAuthSession();

    set({
      user: null,
      status: "unauthenticated",
      isAuthenticated: false,
    });
  },
}));
