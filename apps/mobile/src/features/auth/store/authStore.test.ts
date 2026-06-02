import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import type { AuthUser } from "@/src/features/auth/types/authTypes";

const mockClearHydratedUserProgress = jest.fn(
  async (_userId: string) => undefined,
);
const mockClearAuthSession = jest.fn(async () => undefined);
const mockSaveAuthSession = jest.fn(
  async (_accessToken: string, _user: AuthUser) => undefined,
);

jest.mock("@/src/features/discoveries/storage/discoveryCache", () => ({
  clearHydratedUserProgress: mockClearHydratedUserProgress,
}));

jest.mock("@/src/shared/storage/tokenStorage", () => ({
  clearAuthSession: mockClearAuthSession,
  saveAuthSession: mockSaveAuthSession,
}));

const TEST_USER: AuthUser = {
  id: "user-1",
  email: "user@example.com",
  name: "Test User",
  role: "USER",
  status: "ACTIVE",
  createdAt: "2026-06-03T00:00:00.000Z",
};

type AuthStoreModule = typeof import("./authStore");

function loadAuthStore() {
  jest.resetModules();
  const module = jest.requireActual("./authStore") as AuthStoreModule;

  module.useAuthStore.setState({
    user: null,
    status: "checking",
    isAuthenticated: false,
  });

  return module.useAuthStore;
}

beforeEach(() => {
  mockClearHydratedUserProgress.mockImplementation(async () => undefined);
  mockClearAuthSession.mockImplementation(async () => undefined);
  mockSaveAuthSession.mockImplementation(async () => undefined);
});

afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

describe("useAuthStore", () => {
  it("persists a new session and marks the user authenticated online", async () => {
    const authStore = loadAuthStore();

    await authStore.getState().setSession(TEST_USER, "access-token");

    expect(mockSaveAuthSession).toHaveBeenCalledWith("access-token", TEST_USER);
    expect(authStore.getState()).toMatchObject({
      user: TEST_USER,
      status: "authenticated-online",
      isAuthenticated: true,
    });
  });

  it("restores an offline authenticated session without persisting again", async () => {
    const authStore = loadAuthStore();

    authStore.getState().restoreSession(TEST_USER, "authenticated-offline");

    expect(mockSaveAuthSession).not.toHaveBeenCalled();
    expect(authStore.getState()).toMatchObject({
      user: TEST_USER,
      status: "authenticated-offline",
      isAuthenticated: true,
    });
  });

  it("clears hydrated progress and the stored auth session on logout", async () => {
    const authStore = loadAuthStore();

    authStore.setState({
      user: TEST_USER,
      status: "authenticated-online",
      isAuthenticated: true,
    });

    await authStore.getState().logout();

    expect(mockClearHydratedUserProgress).toHaveBeenCalledWith(TEST_USER.id);
    expect(mockClearAuthSession).toHaveBeenCalledTimes(1);
    expect(authStore.getState()).toMatchObject({
      user: null,
      status: "unauthenticated",
      isAuthenticated: false,
    });
  });
});
