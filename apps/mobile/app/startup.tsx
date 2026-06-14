import { useEffect } from "react";
import { useFonts } from "expo-font";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { getCurrentUser } from "@/src/features/auth/api/authApi";
import { useAuthStore } from "@/src/features/auth/store/authStore";
import { useDiscoveryProgressStore } from "@/src/features/discoveries/store/discoveryProgressStore";
import { rehydrateDiscoveryProgressFromBackend } from "@/src/features/discoveries/sync/discoveryProgressRehydration";
import {
  isApiNetworkError,
  isUnauthorizedApiError,
} from "@/src/shared/api/apiError";
import {
  clearAuthSession,
  getStoredAuthSession,
} from "@/src/shared/storage/tokenStorage";

// Replace this asset or change this path if the startup artwork changes.
const STARTUP_ICON_SOURCE = require("../assets/images/explore_icon_v2.png");
const STARTUP_TITLE_FONT = require("../assets/fonts/Rockabilly.ttf");

export default function StartupScreen() {
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const setChecking = useAuthStore((state) => state.setChecking);
  const setUnauthenticated = useAuthStore((state) => state.setUnauthenticated);
  const markDiscoveryProgressUpdated = useDiscoveryProgressStore(
    (state) => state.markUpdated,
  );
  const [fontsLoaded] = useFonts({
    Rockabilly: STARTUP_TITLE_FONT,
  });

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

        if (isActive) {
          router.replace("/map");
        }
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

    void bootstrap();

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
      <View style={styles.brandLockup}>
        <Image
          contentFit="contain"
          source={STARTUP_ICON_SOURCE}
          style={styles.icon}
        />
        <Text style={[styles.title, fontsLoaded ? styles.titleFont : null]}>
          Explore
        </Text>
      </View>
      <ActivityIndicator color="#111827" size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    backgroundColor: "#fff",
  },
  brandLockup: {
    alignItems: "center",
    gap: 10,
  },
  icon: {
    width: 180,
    height: 180,
    borderRadius: 32,
  },
  title: {
    color: "#111827",
    fontSize: 42,
    lineHeight: 48,
    letterSpacing: 0,
    paddingHorizontal: 10,
  },
  titleFont: {
    fontFamily: "Rockabilly",
  },
});
