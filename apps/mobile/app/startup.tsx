import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { getCurrentUser } from "@/src/features/auth/api/authApi";
import { useDiscoveryProgressStore } from "@/src/features/discoveries/store/discoveryProgressStore";
import { rehydrateDiscoveryProgressFromBackend } from "@/src/features/discoveries/sync/discoveryProgressRehydration";
import { useAuthStore } from "@/src/features/auth/store/authStore";
import {
  clearAuthSession,
  getStoredAuthSession,
} from "@/src/shared/storage/tokenStorage";
import {
  isApiNetworkError,
  isUnauthorizedApiError,
} from "@/src/shared/api/apiError";

export default function StartupScreen() {
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const setChecking = useAuthStore((state) => state.setChecking);
  const setUnauthenticated = useAuthStore((state) => state.setUnauthenticated);
  const markDiscoveryProgressUpdated = useDiscoveryProgressStore(
    (state) => state.markUpdated,
  );

  useEffect(() => {
    let isActive = true;

    async function bootstrap() {
      setChecking();

      const cachedSession = await getStoredAuthSession();

      if (!cachedSession) {
        await clearAuthSession();
        setUnauthenticated();

        if (isActive) {
          router.replace("/(auth)/login");
        }

        return;
      }

      try {
        const user = await getCurrentUser();

        if (!isActive) {
          return;
        }

        try {
          await rehydrateDiscoveryProgressFromBackend(user.id);

          if (isActive) {
            markDiscoveryProgressUpdated();
          }
        } catch {
          // Continue with the live session even if progress rehydration fails.
        }

        if (!isActive) {
          return;
        }

        restoreSession(user, "authenticated-online");
        router.replace("/map");
      } catch (error) {
        if (isApiNetworkError(error)) {
          if (!isActive) {
            return;
          }

          restoreSession(cachedSession.user, "authenticated-offline");
          router.replace("/map");
          return;
        }

        if (isUnauthorizedApiError(error)) {
          await clearAuthSession();
        }

        setUnauthenticated();

        if (isActive) {
          router.replace("/(auth)/login");
        }
      }
    }

    bootstrap();

    return () => {
      isActive = false;
    };
  }, [
    markDiscoveryProgressUpdated,
    restoreSession,
    setChecking,
    setUnauthenticated,
  ]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#111827" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
});
