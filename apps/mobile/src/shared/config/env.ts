import Constants from "expo-constants";
import { Platform } from "react-native";

function getDevServerHost() {
  const hostUri = Constants.expoConfig?.hostUri;

  if (!hostUri) {
    return null;
  }

  return hostUri.split(":")[0] ?? null;
}

function getDefaultApiBaseUrl() {
  const devServerHost = getDevServerHost();

  if (devServerHost) {
    return `http://${devServerHost}:8080/api`;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:8080/api";
  }

  return "http://localhost:8080/api";
}

function normalizeApiBaseUrl(url: string) {
  const trimmedUrl = url.trim().replace(/\/+$/, "");

  if (trimmedUrl.endsWith("/api")) {
    return trimmedUrl;
  }

  return `${trimmedUrl}/api`;
}

export const API_BASE_URL =
  normalizeApiBaseUrl(
    process.env.EXPO_PUBLIC_API_URL?.trim() || getDefaultApiBaseUrl(),
  );
