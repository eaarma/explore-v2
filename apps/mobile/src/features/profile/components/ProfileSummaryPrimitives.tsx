import { Text, View } from "react-native";

import type { ProfileScreenStyles } from "@/src/features/profile/screens/ProfileScreen.styles";

type SummaryChipProps = {
  label: string;
  styles: ProfileScreenStyles;
};

export function SummaryChip({ label, styles }: SummaryChipProps) {
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
  styles: ProfileScreenStyles;
};

export function MetricRow({
  label,
  value,
  isLast = false,
  styles,
}: MetricRowProps) {
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
  styles: ProfileScreenStyles;
};

export function ProgressCard({
  label,
  value,
  isWide = false,
  styles,
}: ProgressCardProps) {
  return (
    <View style={[styles.progressCard, isWide && styles.progressCardWide]}>
      <Text style={styles.progressCardLabel}>{label}</Text>
      <Text style={styles.progressCardValue}>{value}</Text>
    </View>
  );
}

type AccountMetaPillProps = {
  label: string;
  styles: ProfileScreenStyles;
};

export function AccountMetaPill({ label, styles }: AccountMetaPillProps) {
  return (
    <View style={styles.accountMetaPill}>
      <Text style={styles.accountMetaPillText}>{label}</Text>
    </View>
  );
}
