import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";

import { useAuthStore } from "@/src/features/auth/store/authStore";
import {
  hasConfiguredMapTilerApiKey,
  type MapStyleKey,
} from "@/src/features/map/mapConfig";
import {
  deleteDefaultOfflineRoadMapPack,
  getDefaultOfflineRoadMapPackSnapshot,
  repairDefaultOfflineRoadMapPack,
  type DefaultOfflineRoadMapPackSnapshot,
} from "@/src/features/map/storage/defaultOfflineRoadMap";
import { useAppSettingsStore } from "@/src/features/settings/store/appSettingsStore";
import {
  resolveAppColorScheme,
  type AppAppearanceSetting,
} from "@/src/features/settings/utils/appAppearance";
import {
  getAppearanceSummary,
  getOfflineMapProgressLabel,
  getOfflineMapStatusLabel,
  getOfflineMapStorageLabel,
} from "@/src/features/settings/utils/settingsPresentation";
import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";

export function useSettingsScreenState() {
  const status = useAuthStore((state) => state.status);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const appearancePreference = useAppSettingsStore(
    (state) => state.appearancePreference,
  );
  const setAppearancePreference = useAppSettingsStore(
    (state) => state.setAppearancePreference,
  );
  const defaultMapStyle = useAppSettingsStore((state) => state.defaultMapStyle);
  const setDefaultMapStyle = useAppSettingsStore(
    (state) => state.setDefaultMapStyle,
  );
  const offlineRoadMapEnabled = useAppSettingsStore(
    (state) => state.offlineRoadMapEnabled,
  );
  const setOfflineRoadMapEnabled = useAppSettingsStore(
    (state) => state.setOfflineRoadMapEnabled,
  );
  const colorScheme = useColorScheme();
  const [offlineMapSnapshot, setOfflineMapSnapshot] =
    useState<DefaultOfflineRoadMapPackSnapshot | null>(null);
  const [isLoadingOfflineMapStatus, setIsLoadingOfflineMapStatus] =
    useState(true);
  const [isRepairingOfflineMap, setIsRepairingOfflineMap] = useState(false);
  const [isDeletingOfflineMap, setIsDeletingOfflineMap] = useState(false);
  const [offlineMapFeedback, setOfflineMapFeedback] = useState<string | null>(
    null,
  );
  const [offlineMapError, setOfflineMapError] = useState<string | null>(null);

  const hasOfflineMapDownloadSupport = hasConfiguredMapTilerApiKey();
  const systemResolvedTheme = resolveAppColorScheme("system", colorScheme);
  const appearanceSummary = useMemo(
    () => getAppearanceSummary(appearancePreference, systemResolvedTheme),
    [appearancePreference, systemResolvedTheme],
  );
  const offlineMapStatusLabel = useMemo(
    () =>
      getOfflineMapStatusLabel({
        hasOfflineMapDownloadSupport,
        offlineMapSnapshot,
        offlineRoadMapEnabled,
      }),
    [
      hasOfflineMapDownloadSupport,
      offlineMapSnapshot,
      offlineRoadMapEnabled,
    ],
  );
  const offlineMapProgressLabel = useMemo(
    () => getOfflineMapProgressLabel(offlineMapSnapshot),
    [offlineMapSnapshot],
  );
  const offlineMapStorageLabel = useMemo(
    () => getOfflineMapStorageLabel(offlineMapSnapshot),
    [offlineMapSnapshot],
  );

  const refreshOfflineMapStatus = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setIsLoadingOfflineMapStatus(true);
    }

    try {
      const snapshot = await getDefaultOfflineRoadMapPackSnapshot();
      setOfflineMapSnapshot(snapshot);
      setOfflineMapError(null);
    } catch {
      setOfflineMapError("Could not read offline map status right now.");
    } finally {
      if (!isSilent) {
        setIsLoadingOfflineMapStatus(false);
      }
    }
  }, []);

  useEffect(() => {
    void refreshOfflineMapStatus();
  }, [refreshOfflineMapStatus]);

  useEffect(() => {
    if (offlineMapSnapshot?.state !== "active") {
      return;
    }

    const intervalId = setInterval(() => {
      void refreshOfflineMapStatus(true);
    }, 2500);

    return () => {
      clearInterval(intervalId);
    };
  }, [offlineMapSnapshot?.state, refreshOfflineMapStatus]);

  const handleAppearancePress = useCallback(
    async (nextAppearancePreference: AppAppearanceSetting) => {
      await setAppearancePreference(nextAppearancePreference);
    },
    [setAppearancePreference],
  );

  const handleDefaultMapLayerPress = useCallback(
    async (nextMapStyle: MapStyleKey) => {
      await setDefaultMapStyle(nextMapStyle);
    },
    [setDefaultMapStyle],
  );

  const handleRetryOfflineMap = useCallback(async () => {
    setIsRepairingOfflineMap(true);
    setOfflineMapFeedback(null);
    setOfflineMapError(null);

    try {
      await setOfflineRoadMapEnabled(true);
      await repairDefaultOfflineRoadMapPack();
      setOfflineMapFeedback(
        "Offline road map repair started. The pack will keep downloading in the background.",
      );
      await refreshOfflineMapStatus(true);
    } catch {
      setOfflineMapError("Could not repair the offline map right now.");
    } finally {
      setIsRepairingOfflineMap(false);
    }
  }, [refreshOfflineMapStatus, setOfflineRoadMapEnabled]);

  const handleDeleteOfflineMap = useCallback(async () => {
    setIsDeletingOfflineMap(true);
    setOfflineMapFeedback(null);
    setOfflineMapError(null);

    try {
      await deleteDefaultOfflineRoadMapPack();
      await setOfflineRoadMapEnabled(false);
      setOfflineMapFeedback("Offline road map removed from this device.");
      await refreshOfflineMapStatus(true);
    } catch {
      setOfflineMapError("Could not delete the offline map right now.");
    } finally {
      setIsDeletingOfflineMap(false);
    }
  }, [refreshOfflineMapStatus, setOfflineRoadMapEnabled]);

  const confirmDeleteOfflineMap = useCallback(() => {
    Alert.alert(
      "Delete offline map?",
      "This removes the Estonia road pack from this device until you download it again.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void handleDeleteOfflineMap();
          },
        },
      ],
    );
  }, [handleDeleteOfflineMap]);

  return {
    appearancePreference,
    appearanceSummary,
    confirmDeleteOfflineMap,
    defaultMapStyle,
    handleAppearancePress,
    handleDefaultMapLayerPress,
    handleRetryOfflineMap,
    hasOfflineMapDownloadSupport,
    isAuthenticated,
    isDeletingOfflineMap,
    isLoadingOfflineMapStatus,
    isRepairingOfflineMap,
    offlineMapError,
    offlineMapFeedback,
    offlineMapProgressLabel,
    offlineMapStatusLabel,
    offlineMapStorageLabel,
    status,
  };
}
