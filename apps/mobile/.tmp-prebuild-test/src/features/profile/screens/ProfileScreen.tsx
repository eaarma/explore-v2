import { startTransition, useEffect, useState } from "react";
import Constants from "expo-constants";
import { Redirect, router } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getCurrentUser } from "@/src/features/auth/api/authApi";
import { useLogoutFlow } from "@/src/features/auth/hooks/useLogoutFlow";
import { useDiscoveryProgressStore } from "@/src/features/discoveries/store/discoveryProgressStore";
import {
  formatShortDate,
  getRecentActivityEmptyMessage,
} from "@/src/features/discoveries/utils/discoveryPresentation";
import { useAuthStore } from "@/src/features/auth/store/authStore";
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
import { UnsyncedLogoutModal } from "@/src/shared/components/UnsyncedLogoutModal";
import { useContentSyncStore } from "@/src/shared/store/contentSyncStore";
import { saveAuthUser } from "@/src/shared/storage/tokenStorage";

type FeedbackTone = "neutral" | "success" | "warning" | "error";

type FeedbackMessage = {
  tone: FeedbackTone;
  text: string;
};

const APP_VERSION = Constants.expoConfig?.version ?? "dev";

export function ProfileScreen() {
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
  const [feedbackMessage, setFeedbackMessage] = useState<FeedbackMessage | null>(
    null,
  );

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
      loadProfile();
    }

    return () => {
      isMounted = false;
    };
  }, [contentRevision, isAuthenticated, progressRevision, user]);

  if (status === "checking") {
    return <Redirect href="/startup" />;
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/startup" />;
  }

  const isOfflineSession = status === "authenticated-offline";
  const displayName = getDisplayName(user.name, user.email);
  const accountStatusLabel = formatAccountStatus(user.status);
  const syncStatusLabel = getSyncStatusLabel(
    snapshot.lastContentSyncAt,
    isOfflineSession,
    isLoadingProfile,
  );
  const nextTierProgressLabel = getNextTierProgressLabel(snapshot);

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
        text: userError && isApiNetworkError(userError)
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageEyebrow}>Profile</Text>
          <Text style={styles.pageTitle}>Your explorer summary</Text>
          <Text style={styles.pageDescription}>
            Cached identity, local progress, and account actions in one place.
          </Text>
        </View>

        {feedbackMessage ? (
          <View
            style={[
              styles.feedbackBanner,
              feedbackMessage.tone === "success" && styles.feedbackBannerSuccess,
              feedbackMessage.tone === "warning" && styles.feedbackBannerWarning,
              feedbackMessage.tone === "error" && styles.feedbackBannerError,
            ]}
          >
            <Text style={styles.feedbackText}>{feedbackMessage.text}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardEyebrow}>User summary</Text>
            <View
              style={[
                styles.sessionBadge,
                isOfflineSession
                  ? styles.sessionBadgeOffline
                  : styles.sessionBadgeOnline,
              ]}
            >
              <View
                style={[
                  styles.sessionDot,
                  isOfflineSession
                    ? styles.sessionDotOffline
                    : styles.sessionDotOnline,
                ]}
              />
              <Text style={styles.sessionBadgeText}>
                {isOfflineSession ? "Offline mode" : "Synced"}
              </Text>
            </View>
          </View>

          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>

          <View style={styles.summaryChipRow}>
            <SummaryChip label={`Status: ${accountStatusLabel}`} />
            <SummaryChip label={isOfflineSession ? "Cached session" : "Live session"} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>Exploration progress</Text>

          <MetricRow
            label="Locations visited"
            value={`${snapshot.stats.locationsVisited} / ${snapshot.stats.totalLocations}`}
          />
          <MetricRow
            label="Journeys completed"
            value={`${snapshot.stats.journeysCompleted} / ${snapshot.stats.totalJourneys}`}
            isLast
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>Progress summary</Text>

          <View style={styles.progressCardGrid}>
            <ProgressCard
              label="Location progress"
              value={`${snapshot.progress.locationProgressPercent}%`}
            />
            <ProgressCard
              label="Journey progress"
              value={`${snapshot.progress.journeyProgressPercent}%`}
            />
            <ProgressCard
              label="Current tier"
              value={snapshot.progress.currentTier}
              isWide
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>Tier</Text>
          <Text style={styles.tierTitle}>{snapshot.progress.currentTier}</Text>
          <Text style={styles.tierDescription}>{nextTierProgressLabel}</Text>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${snapshot.progress.progressToNextTierPercent}%`,
                },
              ]}
            />
          </View>

          <View style={styles.tierFooter}>
            <Text style={styles.tierFooterText}>
              {snapshot.stats.locationsVisited} / {snapshot.stats.totalLocations}{" "}
              locations visited
            </Text>
            <Text style={styles.tierFooterText}>
              {snapshot.stats.journeysCompleted} / {snapshot.stats.totalJourneys}{" "}
              journeys completed
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>Recent activity</Text>
          {snapshot.recentActivity.length === 0 ? (
            <>
              <Text style={styles.emptyStateTitle}>No discoveries yet.</Text>
              <Text style={styles.emptyStateDescription}>
                {getRecentActivityEmptyMessage({
                  locationsVisited: snapshot.stats.locationsVisited,
                  journeysCompleted: snapshot.stats.journeysCompleted,
                  recentActivity: snapshot.recentActivity,
                })}
              </Text>
            </>
          ) : (
            <View style={styles.activityList}>
              {snapshot.recentActivity.map((activity) => (
                <View
                  key={`${activity.kind}-${activity.entityId}-${activity.occurredAt}`}
                  style={styles.activityRow}
                >
                  <View style={styles.activityCopy}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activityMeta}>
                      {activity.kind === "location"
                        ? "Location discovered"
                        : "Journey completed"}
                    </Text>
                  </View>

                  <View style={styles.activityDatePill}>
                    <Text style={styles.activityDateText}>
                      {formatShortDate(activity.occurredAt)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>Account</Text>

          <View style={styles.compactInfoGroup}>
            <View style={styles.compactInfoRow}>
              <Text style={styles.compactInfoLabel}>Sync status</Text>
              <Text style={styles.compactInfoValue}>{syncStatusLabel}</Text>
            </View>

            <View style={styles.accountMetaRow}>
              <AccountMetaPill label={`v${APP_VERSION}`} />
              <AccountMetaPill label={status} />
              <AccountMetaPill label={`user ${user.id}`} />
            </View>
          </View>

          <View style={styles.actionGroup}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Refresh profile"
              onPress={handleRefreshProfile}
              style={({ pressed }) => [
                styles.primaryAction,
                pressed && styles.primaryActionPressed,
                isRefreshingProfile && styles.actionDisabled,
              ]}
              disabled={isRefreshingProfile}
            >
              {isRefreshingProfile ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryActionText}>Refresh profile</Text>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Logout"
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.secondaryAction,
                pressed && styles.secondaryActionPressed,
                isLogoutBusy && styles.actionDisabled,
              ]}
              disabled={isLogoutBusy}
            >
              {isLogoutBusy ? (
                <ActivityIndicator color="#B91C1C" size="small" />
              ) : (
                <Text style={styles.secondaryActionText}>Logout</Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <UnsyncedLogoutModal
        visible={isUnsyncedLogoutModalVisible}
        isSubmitting={isLoggingOut}
        onCancel={cancelUnsyncedLogout}
        onConfirm={confirmUnsyncedLogout}
      />
    </SafeAreaView>
  );
}

type SummaryChipProps = {
  label: string;
};

function SummaryChip({ label }: SummaryChipProps) {
  return (
    <View style={styles.summaryChip}>
      <Text style={styles.summaryChipText}>{label}</Text>
    </View>
  );
}

type MetricRowProps = {
  label: string;
  value: string;
  isLast?: boolean;
};

function MetricRow({ label, value, isLast = false }: MetricRowProps) {
  return (
    <View style={[styles.metricRow, isLast && styles.metricRowLast]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

type ProgressCardProps = {
  label: string;
  value: string;
  isWide?: boolean;
};

function ProgressCard({ label, value, isWide = false }: ProgressCardProps) {
  return (
    <View style={[styles.progressCard, isWide && styles.progressCardWide]}>
      <Text style={styles.progressCardLabel}>{label}</Text>
      <Text style={styles.progressCardValue}>{value}</Text>
    </View>
  );
}

type AccountMetaPillProps = {
  label: string;
};

function AccountMetaPill({ label }: AccountMetaPillProps) {
  return (
    <View style={styles.accountMetaPill}>
      <Text style={styles.accountMetaPillText}>{label}</Text>
    </View>
  );
}

function getDisplayName(name: string | null | undefined, email: string) {
  const trimmedName = typeof name === "string" ? name.trim() : "";

  if (trimmedName) {
    return trimmedName;
  }

  const emailName = email.split("@")[0]?.trim();

  return emailName || "Explorer";
}

function formatAccountStatus(status: string | null | undefined) {
  const normalizedStatus =
    typeof status === "string" ? status.trim().toLowerCase() : "";

  if (!normalizedStatus) {
    return "Unknown";
  }

  return normalizedStatus
    .split(/[_\s]+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function getSyncStatusLabel(
  lastContentSyncAt: string | null,
  isOfflineSession: boolean,
  isLoadingProfile: boolean,
) {
  if (isLoadingProfile && !lastContentSyncAt) {
    return "Loading cached totals";
  }

  if (!lastContentSyncAt) {
    return isOfflineSession ? "Offline with no completed sync yet" : "Waiting for first sync";
  }

  return isOfflineSession
    ? `Offline | last sync ${formatTimestamp(lastContentSyncAt)}`
    : `Last sync ${formatTimestamp(lastContentSyncAt)}`;
}

function getNextTierProgressLabel(snapshot: ProfileSnapshot) {
  if (!snapshot.progress.nextTier) {
    return "You have reached the highest explorer tier.";
  }

  return `${snapshot.progress.combinedProgressPercent}% combined location and journey progress toward ${snapshot.progress.nextTier}`;
}

function formatTimestamp(value: string) {
  const parsedValue = Date.parse(value);

  if (!Number.isFinite(parsedValue)) {
    return "Unknown";
  }

  return new Date(parsedValue).toLocaleString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4EFE6",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 28,
  },
  pageHeader: {
    gap: 8,
    paddingTop: 8,
  },
  pageEyebrow: {
    color: "#0F766E",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  pageTitle: {
    color: "#0F172A",
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 36,
  },
  pageDescription: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 22,
  },
  feedbackBanner: {
    borderRadius: 18,
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  feedbackBannerSuccess: {
    backgroundColor: "#CCFBF1",
  },
  feedbackBannerWarning: {
    backgroundColor: "#FEF3C7",
  },
  feedbackBannerError: {
    backgroundColor: "#FEE2E2",
  },
  feedbackText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  card: {
    borderRadius: 24,
    backgroundColor: "#FEFCF8",
    padding: 20,
    gap: 14,
    shadowColor: "#1E293B",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  cardEyebrow: {
    color: "#0F766E",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  sessionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sessionBadgeOnline: {
    backgroundColor: "#CCFBF1",
  },
  sessionBadgeOffline: {
    backgroundColor: "#FEF3C7",
  },
  sessionDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  sessionDotOnline: {
    backgroundColor: "#0F766E",
  },
  sessionDotOffline: {
    backgroundColor: "#D97706",
  },
  sessionBadgeText: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "700",
  },
  userName: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
  },
  userEmail: {
    color: "#475569",
    fontSize: 16,
    lineHeight: 22,
  },
  summaryChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  summaryChip: {
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  summaryChipText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "600",
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E7E1D7",
    paddingBottom: 14,
  },
  metricRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  metricLabel: {
    flex: 1,
    color: "#475569",
    fontSize: 15,
    lineHeight: 22,
  },
  metricValue: {
    flexShrink: 1,
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    textAlign: "right",
  },
  progressCardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  progressCard: {
    minWidth: 132,
    flexGrow: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E7E1D7",
    backgroundColor: "#FFFFFF",
    padding: 16,
    gap: 8,
  },
  progressCardWide: {
    width: "100%",
  },
  progressCardLabel: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },
  progressCardValue: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 26,
  },
  tierTitle: {
    color: "#0F172A",
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 30,
  },
  tierDescription: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 22,
  },
  progressTrack: {
    height: 12,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#0F766E",
  },
  tierFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  tierFooterText: {
    flex: 1,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyStateTitle: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 26,
  },
  emptyStateDescription: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 22,
  },
  activityList: {
    gap: 12,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E7E1D7",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  activityCopy: {
    flex: 1,
    gap: 4,
  },
  activityTitle: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
  },
  activityMeta: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },
  activityDatePill: {
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  activityDateText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
  },
  actionGroup: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  primaryAction: {
    minHeight: 46,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#0F766E",
    paddingHorizontal: 16,
  },
  primaryActionPressed: {
    backgroundColor: "#115E59",
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryAction: {
    minHeight: 46,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "#FFF1F2",
    paddingHorizontal: 16,
  },
  secondaryActionPressed: {
    backgroundColor: "#FFE4E6",
  },
  secondaryActionText: {
    color: "#B91C1C",
    fontSize: 15,
    fontWeight: "700",
  },
  actionDisabled: {
    opacity: 0.7,
  },
  compactInfoGroup: {
    gap: 10,
  },
  compactInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  compactInfoLabel: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 20,
  },
  compactInfoValue: {
    flex: 1,
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    textAlign: "right",
  },
  accountMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  accountMetaPill: {
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  accountMetaPillText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "700",
  },
});
