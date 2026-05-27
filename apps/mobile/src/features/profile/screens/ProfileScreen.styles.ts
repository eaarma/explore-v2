import { useMemo } from "react";
import { StyleSheet } from "react-native";

import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";

export type ProfileScreenColors = ReturnType<typeof getProfileScreenColors>;
export type ProfileScreenStyles = ReturnType<typeof createStyles>;

export function useProfileScreenStyles() {
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () => getProfileScreenColors(colorScheme === "dark"),
    [colorScheme],
  );
  const styles = useMemo(() => createStyles(colors), [colors]);

  return {
    colors,
    styles,
  };
}

function getProfileScreenColors(isDark: boolean) {
  if (isDark) {
    return {
      background: "#020617",
      pageEyebrow: "#5EEAD4",
      title: "#F8FAFC",
      body: "#CBD5E1",
      muted: "#94A3B8",
      feedbackNeutralBackground: "#1E293B",
      feedbackSuccessBackground: "#134E4A",
      feedbackWarningBackground: "#713F12",
      feedbackErrorBackground: "#7F1D1D",
      feedbackText: "#F8FAFC",
      cardBackground: "#0F172A",
      cardShadow: "#020617",
      cardEyebrow: "#5EEAD4",
      sessionBadgeOnlineBackground: "#134E4A",
      sessionBadgeOfflineBackground: "#422006",
      sessionDotOnline: "#2DD4BF",
      sessionDotOffline: "#F59E0B",
      sessionBadgeText: "#F8FAFC",
      chipBackground: "#111827",
      chipText: "#E2E8F0",
      divider: "#1E293B",
      strongText: "#F8FAFC",
      progressCardBorder: "#1E293B",
      progressCardBackground: "#111827",
      progressTrack: "#1E293B",
      progressFill: "#2DD4BF",
      activityRowBorder: "#1E293B",
      activityRowBackground: "#111827",
      primaryActionBackground: "#115E59",
      primaryActionPressedBackground: "#134E4A",
      primaryActionText: "#FFFFFF",
      secondaryActionBorder: "#7F1D1D",
      secondaryActionBackground: "#450A0A",
      secondaryActionPressedBackground: "#5F1515",
      secondaryActionText: "#FCA5A5",
    };
  }

  return {
    background: "#F4EFE6",
    pageEyebrow: "#0F766E",
    title: "#0F172A",
    body: "#475569",
    muted: "#64748B",
    feedbackNeutralBackground: "#E2E8F0",
    feedbackSuccessBackground: "#CCFBF1",
    feedbackWarningBackground: "#FEF3C7",
    feedbackErrorBackground: "#FEE2E2",
    feedbackText: "#0F172A",
    cardBackground: "#FEFCF8",
    cardShadow: "#1E293B",
    cardEyebrow: "#0F766E",
    sessionBadgeOnlineBackground: "#CCFBF1",
    sessionBadgeOfflineBackground: "#FEF3C7",
    sessionDotOnline: "#0F766E",
    sessionDotOffline: "#D97706",
    sessionBadgeText: "#0F172A",
    chipBackground: "#F1F5F9",
    chipText: "#334155",
    divider: "#E7E1D7",
    strongText: "#0F172A",
    progressCardBorder: "#E7E1D7",
    progressCardBackground: "#FFFFFF",
    progressTrack: "#E2E8F0",
    progressFill: "#0F766E",
    activityRowBorder: "#E7E1D7",
    activityRowBackground: "#FFFFFF",
    primaryActionBackground: "#0F766E",
    primaryActionPressedBackground: "#115E59",
    primaryActionText: "#FFFFFF",
    secondaryActionBorder: "#FCA5A5",
    secondaryActionBackground: "#FFF1F2",
    secondaryActionPressedBackground: "#FFE4E6",
    secondaryActionText: "#B91C1C",
  };
}

function createStyles(colors: ProfileScreenColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
      color: colors.pageEyebrow,
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    pageTitle: {
      color: colors.title,
      fontSize: 30,
      fontWeight: "700",
      lineHeight: 36,
    },
    pageDescription: {
      color: colors.body,
      fontSize: 15,
      lineHeight: 22,
    },
    feedbackBanner: {
      borderRadius: 18,
      backgroundColor: colors.feedbackNeutralBackground,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    feedbackBannerSuccess: {
      backgroundColor: colors.feedbackSuccessBackground,
    },
    feedbackBannerWarning: {
      backgroundColor: colors.feedbackWarningBackground,
    },
    feedbackBannerError: {
      backgroundColor: colors.feedbackErrorBackground,
    },
    feedbackText: {
      color: colors.feedbackText,
      fontSize: 14,
      fontWeight: "600",
      lineHeight: 20,
    },
    card: {
      borderRadius: 24,
      backgroundColor: colors.cardBackground,
      padding: 20,
      gap: 14,
      shadowColor: colors.cardShadow,
      shadowOffset: {
        width: 0,
        height: 12,
      },
      shadowOpacity: 0.06,
      shadowRadius: 20,
      elevation: 5,
    },
    userSummaryCard: {
      paddingBottom: 74,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    cardEyebrow: {
      color: colors.cardEyebrow,
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
      backgroundColor: colors.sessionBadgeOnlineBackground,
    },
    sessionBadgeOffline: {
      backgroundColor: colors.sessionBadgeOfflineBackground,
    },
    sessionDot: {
      width: 8,
      height: 8,
      borderRadius: 999,
    },
    sessionDotOnline: {
      backgroundColor: colors.sessionDotOnline,
    },
    sessionDotOffline: {
      backgroundColor: colors.sessionDotOffline,
    },
    sessionBadgeText: {
      color: colors.sessionBadgeText,
      fontSize: 13,
      fontWeight: "700",
    },
    userName: {
      color: colors.strongText,
      fontSize: 28,
      fontWeight: "700",
      lineHeight: 34,
    },
    userEmail: {
      color: colors.body,
      fontSize: 16,
      lineHeight: 22,
    },
    summaryChipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    userSummarySettingsButton: {
      position: "absolute",
      right: 20,
      bottom: 20,
      width: 42,
      height: 42,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 14,
      backgroundColor: colors.progressCardBackground,
      borderWidth: 1,
      borderColor: colors.progressCardBorder,
    },
    userSummarySettingsButtonPressed: {
      opacity: 0.84,
    },
    summaryChip: {
      borderRadius: 999,
      backgroundColor: colors.chipBackground,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    summaryChipText: {
      color: colors.chipText,
      fontSize: 13,
      fontWeight: "600",
    },
    metricRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
      paddingBottom: 14,
    },
    metricRowLast: {
      borderBottomWidth: 0,
      paddingBottom: 0,
    },
    metricLabel: {
      flex: 1,
      color: colors.body,
      fontSize: 15,
      lineHeight: 22,
    },
    metricValue: {
      flexShrink: 1,
      color: colors.strongText,
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
      borderColor: colors.progressCardBorder,
      backgroundColor: colors.progressCardBackground,
      padding: 16,
      gap: 8,
    },
    progressCardWide: {
      width: "100%",
    },
    progressCardLabel: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "600",
    },
    progressCardValue: {
      color: colors.strongText,
      fontSize: 20,
      fontWeight: "700",
      lineHeight: 26,
    },
    tierTitle: {
      color: colors.strongText,
      fontSize: 24,
      fontWeight: "700",
      lineHeight: 30,
    },
    tierDescription: {
      color: colors.body,
      fontSize: 15,
      lineHeight: 22,
    },
    progressTrack: {
      height: 12,
      borderRadius: 999,
      overflow: "hidden",
      backgroundColor: colors.progressTrack,
    },
    progressFill: {
      height: "100%",
      borderRadius: 999,
      backgroundColor: colors.progressFill,
    },
    tierFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },
    tierFooterText: {
      flex: 1,
      color: colors.muted,
      fontSize: 13,
      fontWeight: "600",
    },
    emptyStateTitle: {
      color: colors.strongText,
      fontSize: 20,
      fontWeight: "700",
      lineHeight: 26,
    },
    emptyStateDescription: {
      color: colors.body,
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
      borderColor: colors.activityRowBorder,
      backgroundColor: colors.activityRowBackground,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    activityCopy: {
      flex: 1,
      gap: 4,
    },
    activityTitle: {
      color: colors.strongText,
      fontSize: 15,
      fontWeight: "700",
      lineHeight: 21,
    },
    activityMeta: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "600",
    },
    activityDatePill: {
      borderRadius: 999,
      backgroundColor: colors.chipBackground,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    activityDateText: {
      color: colors.chipText,
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
      backgroundColor: colors.primaryActionBackground,
      paddingHorizontal: 16,
    },
    primaryActionPressed: {
      backgroundColor: colors.primaryActionPressedBackground,
    },
    primaryActionText: {
      color: colors.primaryActionText,
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
      borderColor: colors.secondaryActionBorder,
      backgroundColor: colors.secondaryActionBackground,
      paddingHorizontal: 16,
    },
    secondaryActionPressed: {
      backgroundColor: colors.secondaryActionPressedBackground,
    },
    secondaryActionText: {
      color: colors.secondaryActionText,
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
      color: colors.body,
      fontSize: 14,
      lineHeight: 20,
    },
    compactInfoValue: {
      flex: 1,
      color: colors.strongText,
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
      backgroundColor: colors.chipBackground,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    accountMetaPillText: {
      color: colors.body,
      fontSize: 12,
      fontWeight: "700",
    },
  });
}
