import { startTransition, useEffect, useState } from "react";
import { useRouter } from "expo-router";

import { getCurrentUser } from "@/src/features/auth/api/authApi";
import { useLogoutFlow } from "@/src/features/auth/hooks/useLogoutFlow";
import { useAuthStore } from "@/src/features/auth/store/authStore";
import { useDiscoveryProgressStore } from "@/src/features/discoveries/store/discoveryProgressStore";
import {
  deleteCurrentUserAccount,
  updateCurrentUserName,
} from "@/src/features/profile/api/profileApi";
import {
  createPlaceholderProfileSnapshot,
  getProfileSnapshot,
  type ProfileSnapshot,
  refreshProfileSnapshot,
} from "@/src/features/profile/data/profileData";
import {
  getApiErrorMessage,
  isApiNetworkError,
  isUnauthorizedApiError,
} from "@/src/shared/api/apiError";
import { useContentSyncStore } from "@/src/shared/store/contentSyncStore";
import { saveAuthUser } from "@/src/shared/storage/tokenStorage";

export type FeedbackMessage = {
  tone: "neutral" | "success" | "warning" | "error";
  text: string;
};

export function useProfileScreenState() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const logout = useAuthStore((state) => state.logout);
  const progressRevision = useDiscoveryProgressStore((state) => state.revision);
  const contentRevision = useContentSyncStore((state) => state.revision);
  const markContentUpdated = useContentSyncStore((state) => state.markUpdated);
  const {
    cancelUnsyncedLogout,
    confirmUnsyncedLogout,
    isLoggingOut,
    isLogoutBusy,
    isUnsyncedLogoutModalVisible,
    requestLogout,
  } = useLogoutFlow();

  const [snapshot, setSnapshot] = useState<ProfileSnapshot>(
    createPlaceholderProfileSnapshot(),
  );
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isRefreshingProfile, setIsRefreshingProfile] = useState(false);
  const [isAccountSettingsVisible, setIsAccountSettingsVisible] =
    useState(false);
  const [isAccountMutationPending, setIsAccountMutationPending] =
    useState(false);
  const [feedbackMessage, setFeedbackMessage] =
    useState<FeedbackMessage | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      const currentUser = user;

      if (!currentUser) {
        return;
      }

      setIsLoadingProfile(true);

      try {
        const nextSnapshot = await getProfileSnapshot(currentUser.id);

        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setSnapshot(nextSnapshot);
          setFeedbackMessage(null);
        });
      } catch {
        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setSnapshot(createPlaceholderProfileSnapshot());
          setFeedbackMessage({
            tone: "warning",
            text: "Showing placeholder progress until local totals are available.",
          });
        });
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    }

    if (isAuthenticated && user) {
      void loadProfile();
    }

    return () => {
      isMounted = false;
    };
  }, [contentRevision, isAuthenticated, progressRevision, user]);

  const isOfflineSession = status === "authenticated-offline";

  async function handleRefreshProfile() {
    if (isRefreshingProfile || !user) {
      return;
    }

    const currentUser = user;

    setIsRefreshingProfile(true);
    setFeedbackMessage({
      tone: "neutral",
      text: "Refreshing profile data and cached totals...",
    });

    const [userResult, snapshotResult] = await Promise.allSettled([
      getCurrentUser(),
      refreshProfileSnapshot(currentUser.id),
    ]);
    const userError = userResult.status === "rejected" ? userResult.reason : null;
    const snapshotError =
      snapshotResult.status === "rejected" ? snapshotResult.reason : null;

    if (userResult.status === "fulfilled") {
      await saveAuthUser(userResult.value);
      restoreSession(userResult.value, "authenticated-online");
    } else if (userError && isUnauthorizedApiError(userError)) {
      setIsRefreshingProfile(false);
      await logout();
      router.replace("/(auth)/login");
      return;
    } else if (userError && isApiNetworkError(userError)) {
      restoreSession(currentUser, "authenticated-offline");
    }

    if (snapshotResult.status === "fulfilled") {
      setSnapshot(snapshotResult.value);
      markContentUpdated();
    }

    if (
      userResult.status === "fulfilled" &&
      snapshotResult.status === "fulfilled"
    ) {
      setFeedbackMessage({
        tone: "success",
        text: "Profile refreshed and local totals are up to date.",
      });
    } else if (
      userResult.status === "fulfilled" &&
      snapshotResult.status === "rejected"
    ) {
      setFeedbackMessage({
        tone: "warning",
        text: "Account refreshed, but cached exploration totals could not sync.",
      });
    } else if (
      userResult.status === "rejected" &&
      snapshotResult.status === "fulfilled"
    ) {
      setFeedbackMessage({
        tone: userError && isApiNetworkError(userError) ? "warning" : "error",
        text:
          userError && isApiNetworkError(userError)
            ? "Stats refreshed, but account verification is still offline."
            : "Stats refreshed, but account details could not be verified.",
      });
    } else {
      setFeedbackMessage({
        tone:
          (userError && isApiNetworkError(userError)) ||
          (snapshotError && isApiNetworkError(snapshotError))
            ? "warning"
            : "error",
        text:
          (userError && isApiNetworkError(userError)) ||
          (snapshotError && isApiNetworkError(snapshotError))
            ? "Still offline. Showing cached profile data."
            : getApiErrorMessage(
                userError,
                "Could not refresh the profile right now.",
              ),
      });
    }

    setIsRefreshingProfile(false);
  }

  async function handleLogout() {
    if (isLogoutBusy) {
      return;
    }

    await requestLogout();
  }

  async function handleSaveUserName(nextName: string) {
    if (isAccountMutationPending || !user) {
      return;
    }

    setIsAccountMutationPending(true);

    try {
      const updatedUser = await updateCurrentUserName(nextName);
      await saveAuthUser(updatedUser);
      restoreSession(updatedUser, "authenticated-online");
      setIsAccountSettingsVisible(false);
      setFeedbackMessage({
        tone: "success",
        text: "Username updated.",
      });
    } catch (error) {
      if (isUnauthorizedApiError(error)) {
        setIsAccountSettingsVisible(false);
        setIsAccountMutationPending(false);
        await logout();
        router.replace("/(auth)/login");
        return;
      }

      setFeedbackMessage({
        tone: isApiNetworkError(error) ? "warning" : "error",
        text: getApiErrorMessage(
          error,
          "Could not update your username right now.",
        ),
      });
    } finally {
      setIsAccountMutationPending(false);
    }
  }

  async function handleDeleteUser() {
    if (isAccountMutationPending || !user) {
      return;
    }

    setIsAccountMutationPending(true);

    try {
      await deleteCurrentUserAccount();
      setIsAccountSettingsVisible(false);
      await logout();
      router.replace("/(auth)/login");
    } catch (error) {
      if (isUnauthorizedApiError(error)) {
        setIsAccountSettingsVisible(false);
        setIsAccountMutationPending(false);
        await logout();
        router.replace("/(auth)/login");
        return;
      }

      setFeedbackMessage({
        tone: isApiNetworkError(error) ? "warning" : "error",
        text: getApiErrorMessage(
          error,
          "Could not delete this user right now.",
        ),
      });
    } finally {
      setIsAccountMutationPending(false);
    }
  }

  return {
    cancelUnsyncedLogout,
    confirmUnsyncedLogout,
    feedbackMessage,
    handleDeleteUser,
    handleLogout,
    handleRefreshProfile,
    handleSaveUserName,
    isAccountMutationPending,
    isAccountSettingsVisible,
    isAuthenticated,
    isLoadingProfile,
    isLoggingOut,
    isLogoutBusy,
    isOfflineSession,
    isRefreshingProfile,
    isUnsyncedLogoutModalVisible,
    setIsAccountSettingsVisible,
    snapshot,
    status,
    user,
  };
}
