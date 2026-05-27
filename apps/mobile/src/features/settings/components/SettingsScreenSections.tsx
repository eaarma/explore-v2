import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";

import { DEFAULT_OFFLINE_ROAD_MAP_LABEL } from "@/src/features/map/storage/defaultOfflineRoadMap";
import type {
  SettingsScreenColors,
  SettingsScreenStyles,
} from "@/src/features/settings/screens/SettingsScreen.styles";

type SharedSectionProps = {
  colors: SettingsScreenColors;
  styles: SettingsScreenStyles;
};

type SettingsSectionCardProps = SharedSectionProps & {
  children: ReactNode;
  description: string;
  title: string;
};

type SettingsOption<Key extends string> = {
  key: Key;
  label: string;
};

type SettingsOptionSectionProps<Key extends string> = SharedSectionProps & {
  activeKey: Key;
  description: string;
  helperText: string;
  onSelect: (key: Key) => void;
  options: readonly SettingsOption<Key>[];
  title: string;
};

type OfflineMapSettingsSectionProps = SharedSectionProps & {
  hasOfflineMapDownloadSupport: boolean;
  isDeletingOfflineMap: boolean;
  isLoadingOfflineMapStatus: boolean;
  isRepairingOfflineMap: boolean;
  offlineMapError: string | null;
  offlineMapFeedback: string | null;
  offlineMapProgressLabel: string | null;
  offlineMapStatusLabel: string;
  offlineMapStorageLabel: string | null;
  onDeleteOfflineMap: () => void;
  onRetryOfflineMap: () => void;
};

type SettingsLinkRowProps = SharedSectionProps & {
  label: string;
  onPress: () => void;
};

type SettingRowProps = SharedSectionProps & {
  label: string;
  value: string;
};

export function SettingsHeroCard({
  styles,
}: SharedSectionProps) {
  return (
    <View style={styles.heroCard}>
      <Text style={styles.eyebrow}>Settings</Text>
      <Text style={styles.heroTitle}>Tune how Explore feels before launch.</Text>
      <Text style={styles.heroCopy}>
        Theme, map defaults, and the offline Estonia road pack are all live in
        this MVP build.
      </Text>
    </View>
  );
}

export function SettingsSectionCard({
  children,
  description,
  styles,
  title,
}: SettingsSectionCardProps) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionDescription}>{description}</Text>
      {children}
    </View>
  );
}

export function SettingsOptionSection<Key extends string>({
  activeKey,
  colors,
  description,
  helperText,
  onSelect,
  options,
  styles,
  title,
}: SettingsOptionSectionProps<Key>) {
  return (
    <SettingsSectionCard
      colors={colors}
      description={description}
      styles={styles}
      title={title}
    >
      <View style={styles.optionWrap}>
        {options.map((option) => {
          const isActive = activeKey === option.key;

          return (
            <Pressable
              key={option.key}
              accessibilityRole="button"
              onPress={() => onSelect(option.key)}
              style={[
                styles.optionChip,
                {
                  backgroundColor: isActive
                    ? colors.activeChipBackground
                    : colors.chipBackground,
                  borderColor: isActive
                    ? colors.activeChipBackground
                    : colors.chipBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.optionChipText,
                  {
                    color: isActive
                      ? colors.activeChipText
                      : colors.chipText,
                  },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.helperText}>{helperText}</Text>
    </SettingsSectionCard>
  );
}

export function OfflineMapSettingsSection({
  colors,
  hasOfflineMapDownloadSupport,
  isDeletingOfflineMap,
  isLoadingOfflineMapStatus,
  isRepairingOfflineMap,
  offlineMapError,
  offlineMapFeedback,
  offlineMapProgressLabel,
  offlineMapStatusLabel,
  offlineMapStorageLabel,
  onDeleteOfflineMap,
  onRetryOfflineMap,
  styles,
}: OfflineMapSettingsSectionProps) {
  return (
    <SettingsSectionCard
      colors={colors}
      description="The app manages one Estonia road pack for MVP offline browsing."
      styles={styles}
      title="Offline maps"
    >
      <View style={styles.statusCard}>
        <SettingRow
          colors={colors}
          label="Offline map status"
          styles={styles}
          value={offlineMapStatusLabel}
        />
        <SettingRow
          colors={colors}
          label="Downloaded region"
          styles={styles}
          value={DEFAULT_OFFLINE_ROAD_MAP_LABEL}
        />
        {offlineMapProgressLabel ? (
          <SettingRow
            colors={colors}
            label="Progress"
            styles={styles}
            value={offlineMapProgressLabel}
          />
        ) : null}
        {offlineMapStorageLabel ? (
          <SettingRow
            colors={colors}
            label="Storage used"
            styles={styles}
            value={offlineMapStorageLabel}
          />
        ) : null}
      </View>

      {!hasOfflineMapDownloadSupport ? (
        <View
          style={[
            styles.feedbackCard,
            {
              backgroundColor: colors.warningBackground,
            },
          ]}
        >
          <Text
            style={[
              styles.feedbackText,
              {
                color: colors.warningText,
              },
            ]}
          >
            Offline map downloads are not available in this build because the
            map tile key is missing.
          </Text>
        </View>
      ) : null}

      {isLoadingOfflineMapStatus ? (
        <View style={styles.inlineStatusRow}>
          <ActivityIndicator color={colors.accent} size="small" />
          <Text style={styles.inlineStatusText}>
            Checking offline pack state...
          </Text>
        </View>
      ) : null}

      {offlineMapFeedback ? (
        <View
          style={[
            styles.feedbackCard,
            {
              backgroundColor: colors.positiveBackground,
            },
          ]}
        >
          <Text
            style={[
              styles.feedbackText,
              {
                color: colors.positiveText,
              },
            ]}
          >
            {offlineMapFeedback}
          </Text>
        </View>
      ) : null}

      {offlineMapError ? (
        <View
          style={[
            styles.feedbackCard,
            {
              backgroundColor: colors.warningBackground,
            },
          ]}
        >
          <Text
            style={[
              styles.feedbackText,
              {
                color: colors.warningText,
              },
            ]}
          >
            {offlineMapError}
          </Text>
        </View>
      ) : null}

      <View style={styles.actionColumn}>
        <Pressable
          accessibilityRole="button"
          disabled={
            !hasOfflineMapDownloadSupport ||
            isRepairingOfflineMap ||
            isDeletingOfflineMap
          }
          onPress={onRetryOfflineMap}
          style={[
            styles.actionButton,
            {
              backgroundColor: colors.activeChipBackground,
            },
            (isRepairingOfflineMap || isDeletingOfflineMap) &&
              styles.actionButtonDisabled,
          ]}
        >
          <Text style={styles.actionButtonPrimaryText}>
            {isRepairingOfflineMap
              ? "Repairing offline map..."
              : "Retry / repair offline map"}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          disabled={
            !hasOfflineMapDownloadSupport ||
            isDeletingOfflineMap ||
            isRepairingOfflineMap
          }
          onPress={onDeleteOfflineMap}
          style={[
            styles.actionButton,
            {
              backgroundColor: colors.destructiveBackground,
              borderColor: colors.destructive,
            },
            styles.destructiveButton,
            (isDeletingOfflineMap || isRepairingOfflineMap) &&
              styles.actionButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.actionButtonSecondaryText,
              {
                color: colors.destructive,
              },
            ]}
          >
            {isDeletingOfflineMap
              ? "Deleting offline map..."
              : "Delete offline map"}
          </Text>
        </Pressable>
      </View>
    </SettingsSectionCard>
  );
}

export function SettingsLinkRow({
  label,
  onPress,
  styles,
}: SettingsLinkRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.linkRow}
    >
      <Text style={styles.linkRowLabel}>{label}</Text>
      <Text style={styles.linkRowChevron}>{">"}</Text>
    </Pressable>
  );
}

export function SettingRow({ label, styles, value }: SettingRowProps) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.settingValue}>{value}</Text>
    </View>
  );
}
