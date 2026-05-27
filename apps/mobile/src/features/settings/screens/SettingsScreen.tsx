import Constants from "expo-constants";
import { Redirect, useRouter } from "expo-router";
import { ScrollView } from "react-native";

import {
  OfflineMapSettingsSection,
  SettingsHeroCard,
  SettingsLinkRow,
  SettingsOptionSection,
  SettingsSectionCard,
  SettingRow,
} from "@/src/features/settings/components/SettingsScreenSections";
import { useSettingsScreenState } from "@/src/features/settings/hooks/useSettingsScreenState";
import { MAP_STYLE_OPTIONS } from "@/src/features/map/mapConfig";
import {
  useSettingsScreenStyles,
} from "@/src/features/settings/screens/SettingsScreen.styles";
import { APP_APPEARANCE_OPTIONS } from "@/src/features/settings/utils/appAppearance";

const APP_VERSION =
  Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "1.0.0";

export function SettingsScreen() {
  const router = useRouter();
  const { colors, styles } = useSettingsScreenStyles();
  const {
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
  } = useSettingsScreenState();

  if (status === "checking") {
    return <Redirect href="/startup" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/startup" />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <SettingsHeroCard colors={colors} styles={styles} />

      <SettingsOptionSection
        activeKey={appearancePreference}
        colors={colors}
        description="Choose whether the app follows your device theme or stays pinned to a single mode."
        helperText={appearanceSummary}
        onSelect={handleAppearancePress}
        options={APP_APPEARANCE_OPTIONS}
        styles={styles}
        title="Appearance"
      />

      <SettingsOptionSection
        activeKey={defaultMapStyle}
        colors={colors}
        description="Choose which layer the map should open with by default."
        helperText="Changing the map layer inside the map view also updates this default."
        onSelect={handleDefaultMapLayerPress}
        options={MAP_STYLE_OPTIONS}
        styles={styles}
        title="Map"
      />

      <OfflineMapSettingsSection
        colors={colors}
        hasOfflineMapDownloadSupport={hasOfflineMapDownloadSupport}
        isDeletingOfflineMap={isDeletingOfflineMap}
        isLoadingOfflineMapStatus={isLoadingOfflineMapStatus}
        isRepairingOfflineMap={isRepairingOfflineMap}
        offlineMapError={offlineMapError}
        offlineMapFeedback={offlineMapFeedback}
        offlineMapProgressLabel={offlineMapProgressLabel}
        offlineMapStatusLabel={offlineMapStatusLabel}
        offlineMapStorageLabel={offlineMapStorageLabel}
        onDeleteOfflineMap={confirmDeleteOfflineMap}
        onRetryOfflineMap={handleRetryOfflineMap}
        styles={styles}
      />

      <SettingsSectionCard
        colors={colors}
        description="Legal links are placeholder pages in this branch, but the routes are ready for final copy."
        styles={styles}
        title="Info"
      >
        <SettingsLinkRow
          colors={colors}
          label="Privacy policy"
          onPress={() => router.push("/privacy-policy")}
          styles={styles}
        />
        <SettingsLinkRow
          colors={colors}
          label="Terms"
          onPress={() => router.push("/terms")}
          styles={styles}
        />
        <SettingsLinkRow
          colors={colors}
          label="Licenses"
          onPress={() => router.push("/licenses")}
          styles={styles}
        />
        <SettingRow
          colors={colors}
          label="App version"
          styles={styles}
          value={APP_VERSION}
        />
      </SettingsSectionCard>
    </ScrollView>
  );
}
