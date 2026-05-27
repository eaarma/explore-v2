import Constants from "expo-constants";
import { Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";

import {
  formatShortDate,
  getRecentActivityEmptyMessage,
} from "@/src/features/discoveries/utils/discoveryPresentation";
import { AccountSettingsDialog } from "@/src/features/profile/components/AccountSettingsDialog";
import {
  AccountMetaPill,
  MetricRow,
  ProgressCard,
  SummaryChip,
} from "@/src/features/profile/components/ProfileSummaryPrimitives";
import { useProfileScreenState } from "@/src/features/profile/hooks/useProfileScreenState";
import {
  useProfileScreenStyles,
} from "@/src/features/profile/screens/ProfileScreen.styles";
import {
  formatAccountStatus,
  getDisplayName,
  getNextTierProgressLabel,
  getSyncStatusLabel,
} from "@/src/features/profile/utils/profilePresentation";
import { UnsyncedLogoutModal } from "@/src/shared/components/UnsyncedLogoutModal";

const APP_VERSION = Constants.expoConfig?.version ?? "dev";

export function ProfileScreen() {
  const { colors, styles } = useProfileScreenStyles();
  const {
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
  } = useProfileScreenState();

  if (status === "checking") {
    return <Redirect href="/startup" />;
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/startup" />;
  }

  const displayName = getDisplayName(user.name, user.email);
  const accountStatusLabel = formatAccountStatus(user.status);
  const syncStatusLabel = getSyncStatusLabel(
    snapshot.lastContentSyncAt,
    isOfflineSession,
    isLoadingProfile,
  );
  const nextTierProgressLabel = getNextTierProgressLabel(snapshot);

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

        <View style={[styles.card, styles.userSummaryCard]}>
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
            <SummaryChip
              label={`Status: ${accountStatusLabel}`}
              styles={styles}
            />
            <SummaryChip
              label={isOfflineSession ? "Cached session" : "Live session"}
              styles={styles}
            />
          </View>

          <Pressable
            accessibilityLabel="Open account settings"
            accessibilityRole="button"
            onPress={() => setIsAccountSettingsVisible(true)}
            style={({ pressed }) => [
              styles.userSummarySettingsButton,
              pressed && styles.userSummarySettingsButtonPressed,
            ]}
          >
            <Ionicons color={colors.muted} name="settings-outline" size={20} />
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>Exploration progress</Text>

          <MetricRow
            label="Locations visited"
            value={`${snapshot.stats.locationsVisited} / ${snapshot.stats.totalLocations}`}
            styles={styles}
          />
          <MetricRow
            label="Journeys completed"
            value={`${snapshot.stats.journeysCompleted} / ${snapshot.stats.totalJourneys}`}
            isLast
            styles={styles}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>Progress summary</Text>

          <View style={styles.progressCardGrid}>
            <ProgressCard
              label="Location progress"
              value={`${snapshot.progress.locationProgressPercent}%`}
              styles={styles}
            />
            <ProgressCard
              label="Journey progress"
              value={`${snapshot.progress.journeyProgressPercent}%`}
              styles={styles}
            />
            <ProgressCard
              label="Current tier"
              value={snapshot.progress.currentTier}
              isWide
              styles={styles}
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
              <AccountMetaPill label={`v${APP_VERSION}`} styles={styles} />
              <AccountMetaPill label={status} styles={styles} />
              <AccountMetaPill label={`user ${user.id}`} styles={styles} />
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
                <ActivityIndicator color={colors.primaryActionText} size="small" />
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
                <ActivityIndicator color={colors.secondaryActionText} size="small" />
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

      <AccountSettingsDialog
        currentName={user.name}
        isOfflineSession={isOfflineSession}
        isSubmitting={isAccountMutationPending}
        onClose={() => setIsAccountSettingsVisible(false)}
        onDeleteUser={handleDeleteUser}
        onSaveName={handleSaveUserName}
        visible={isAccountSettingsVisible}
      />
    </SafeAreaView>
  );
}
