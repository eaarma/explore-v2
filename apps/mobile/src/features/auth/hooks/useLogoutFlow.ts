import { useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/src/features/auth/store/authStore";
import { getPendingOfflineProgressSummary } from "@/src/features/discoveries/storage/discoveryCache";

export function useLogoutFlow() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isCheckingPendingProgress, setIsCheckingPendingProgress] =
    useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUnsyncedLogoutModalVisible, setIsUnsyncedLogoutModalVisible] =
    useState(false);

  async function requestLogout() {
    if (!user || isCheckingPendingProgress || isLoggingOut) {
      return;
    }

    setIsCheckingPendingProgress(true);

    try {
      const pendingProgress = await getPendingOfflineProgressSummary(user.id);

      if (pendingProgress.totalCount > 0) {
        setIsUnsyncedLogoutModalVisible(true);
        return;
      }

      await completeLogout();
    } catch {
      Alert.alert(
        "Could not log out",
        "Could not verify unsynced discoveries right now. Please try again.",
      );
    } finally {
      setIsCheckingPendingProgress(false);
    }
  }

  function cancelUnsyncedLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsUnsyncedLogoutModalVisible(false);
  }

  async function confirmUnsyncedLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsUnsyncedLogoutModalVisible(false);
    await completeLogout();
  }

  async function completeLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
      router.replace("/(auth)/login");
    } catch {
      Alert.alert(
        "Could not log out",
        "Please try again. Your cached progress has not been changed.",
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  return {
    isCheckingPendingProgress,
    isLoggingOut,
    isLogoutBusy: isCheckingPendingProgress || isLoggingOut,
    isUnsyncedLogoutModalVisible,
    requestLogout,
    cancelUnsyncedLogout,
    confirmUnsyncedLogout,
  };
}
