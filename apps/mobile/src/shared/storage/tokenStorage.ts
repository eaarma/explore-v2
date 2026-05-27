// src/shared/storage/tokenStorage.ts

import * as SecureStore from "expo-secure-store";
import { AuthUser } from "@/src/features/auth/types/authTypes";

const ACCESS_TOKEN_KEY = "accessToken";
const AUTH_USER_KEY = "authUser";

export type StoredAuthSession = {
  accessToken: string;
  user: AuthUser;
};

export async function saveAccessToken(accessToken: string) {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
}

export async function saveAuthUser(user: AuthUser) {
  await SecureStore.setItemAsync(AUTH_USER_KEY, JSON.stringify(user));
}

export async function saveAuthSession(
  accessToken: string,
  user: AuthUser,
) {
  await Promise.all([saveAccessToken(accessToken), saveAuthUser(user)]);
}

export async function getAccessToken() {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getStoredAuthUser() {
  const rawUser = await SecureStore.getItemAsync(AUTH_USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    await SecureStore.deleteItemAsync(AUTH_USER_KEY);
    return null;
  }
}

export async function getStoredAuthSession(): Promise<StoredAuthSession | null> {
  const [accessToken, user] = await Promise.all([
    getAccessToken(),
    getStoredAuthUser(),
  ]);

  if (!accessToken || !user) {
    return null;
  }

  return {
    accessToken,
    user,
  };
}

export async function clearAccessToken() {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
}

export async function clearAuthUser() {
  await SecureStore.deleteItemAsync(AUTH_USER_KEY);
}

export async function clearAuthSession() {
  await Promise.all([clearAccessToken(), clearAuthUser()]);
}
