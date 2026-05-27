// app/(tabs)/_layout.tsx
import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/src/features/auth/store/authStore";
import { useDiscoveryProgressStore } from "@/src/features/discoveries/store/discoveryProgressStore";
import { useAppSettingsStore } from "@/src/features/settings/store/appSettingsStore";
import { getPendingOfflineDiscoveries } from "@/src/features/discoveries/storage/discoveryCache";
import { syncPendingOfflineDiscoveries } from "@/src/features/discoveries/sync/offlineDiscoverySync";
import { ensureDefaultOfflineRoadMapPack } from "@/src/features/map/storage/defaultOfflineRoadMap";
import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";
import { HeaderMoreMenu } from "@/src/shared/components/HeaderMoreMenu";
import { useContentSyncStore } from "@/src/shared/store/contentSyncStore";
import { syncAllContentCaches } from "@/src/features/content/storage/contentSync";

const AUTO_CONTENT_SYNC_MIN_INTERVAL_MS = 30_000;

export default function TabsLayout() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const settingsHydrated = useAppSettingsStore((state) => state.isHydrated);
  const offlineRoadMapEnabled = useAppSettingsStore(
    (state) => state.offlineRoadMapEnabled,
  );
  const markContentUpdated = useContentSyncStore((state) => state.markUpdated);
  const markDiscoveryProgressUpdated = useDiscoveryProgressStore(
    (state) => state.markUpdated,
  );
  const colorScheme = useColorScheme();
  const autoSyncInFlightRef = useRef(false);
  const lastAutoSyncStartedAtRef = useRef(0);

  useEffect(() => {
    const sessionUser = user;

    if (!isAuthenticated || !sessionUser) {
      return;
    }

    const authenticatedUser = sessionUser;

    let isMounted = true;

    async function runAutoContentSync(force = false) {
      if (autoSyncInFlightRef.current) {
        return;
      }

      const now = Date.now();
      if (
        !force &&
        now - lastAutoSyncStartedAtRef.current <
          AUTO_CONTENT_SYNC_MIN_INTERVAL_MS
      ) {
        return;
      }

      autoSyncInFlightRef.current = true;
      lastAutoSyncStartedAtRef.current = now;

      if (
        settingsHydrated &&
        offlineRoadMapEnabled &&
        status === "authenticated-online"
      ) {
        void ensureDefaultOfflineRoadMapPack();
      }

      let didReachBackend = false;
      let shouldRefreshDiscoveryProgress = false;

      try {
        await syncAllContentCaches();
        didReachBackend = true;

        if (isMounted) {
          markContentUpdated();
        }
      } catch {
        // Keep the current cached content visible when background sync fails.
      }

      try {
        const pendingOfflineDiscoveries = await getPendingOfflineDiscoveries(
          authenticatedUser.id,
        );

        if (pendingOfflineDiscoveries.length > 0) {
          const replayResult = await syncPendingOfflineDiscoveries(
            authenticatedUser.id,
          );
          didReachBackend = true;
          shouldRefreshDiscoveryProgress =
            replayResult.discoveredLocationCount > 0 ||
            replayResult.completedJourneyCount > 0;
        }
      } catch {
        // Keep the offline queue for the next successful sync attempt.
      } finally {
        if (didReachBackend && isMounted && status !== "authenticated-online") {
          restoreSession(authenticatedUser, "authenticated-online");
        }

        if (shouldRefreshDiscoveryProgress && isMounted) {
          markDiscoveryProgressUpdated();
        }

        autoSyncInFlightRef.current = false;
      }
    }

    void runAutoContentSync(true);

    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextAppState) => {
        if (nextAppState === "active") {
          void runAutoContentSync();
        }
      },
    );

    return () => {
      isMounted = false;
      appStateSubscription.remove();
    };
  }, [
    isAuthenticated,
    markContentUpdated,
    markDiscoveryProgressUpdated,
    offlineRoadMapEnabled,
    restoreSession,
    settingsHydrated,
    status,
    user,
  ]);

  if (status === "checking") {
    return <Redirect href="/startup" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/startup" />;
  }

  const headerBackgroundColor =
    colorScheme === "dark" ? "#0F172A" : "#FFFFFF";
  const headerTintColor = colorScheme === "dark" ? "#F8FAFC" : "#0F172A";
  const tabBarBackgroundColor =
    colorScheme === "dark" ? "#0F172A" : "#FFFFFF";
  const tabBarBorderColor = colorScheme === "dark" ? "#1E293B" : "#E2E8F0";
  const tabBarActiveTintColor = colorScheme === "dark" ? "#2DD4BF" : "#0F766E";
  const tabBarInactiveTintColor =
    colorScheme === "dark" ? "#94A3B8" : "#64748B";

  return (
    <Tabs
      screenOptions={{
        headerRight: () => <HeaderMoreMenu />,
        headerStyle: {
          backgroundColor: headerBackgroundColor,
        },
        headerTintColor,
        headerTitleStyle: {
          fontWeight: "700",
        },
        tabBarStyle: {
          backgroundColor: tabBarBackgroundColor,
          borderTopColor: tabBarBorderColor,
        },
        tabBarActiveTintColor,
        tabBarInactiveTintColor,
        sceneStyle: {
          backgroundColor: colorScheme === "dark" ? "#020617" : "#F8FAFC",
        },
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              color={color}
              name={focused ? "compass" : "compass-outline"}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="locations"
        options={{
          title: "Locations",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              color={color}
              name={focused ? "location" : "location-outline"}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              color={color}
              name={focused ? "person" : "person-outline"}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
