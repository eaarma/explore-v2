import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  useLocationSectionColors,
  type LocationSectionColors,
} from "@/src/features/locations/components/locationsSectionShared";

type CreateTripComposerProps = {
  actionLabel?: string;
  initialName: string;
  isSubmitting?: boolean;
  onCancel?: () => void;
  onSave: (name: string) => void | Promise<void>;
  title?: string;
};

export function CreateTripComposer({
  actionLabel = "Save trip",
  initialName,
  isSubmitting = false,
  onCancel,
  onSave,
  title = "Create trip",
}: CreateTripComposerProps) {
  const colors = useLocationSectionColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [name, setName] = useState(initialName);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  const normalizedName = name.trim();

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      <TextInput
        autoCapitalize="sentences"
        autoCorrect={false}
        editable={!isSubmitting}
        onChangeText={setName}
        placeholder="Custom trip"
        placeholderTextColor={colors.controlLabel}
        style={styles.input}
        value={name}
      />

      <View style={styles.actions}>
        {onCancel ? (
          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={onCancel}
            style={({ pressed }) => [
              styles.secondaryAction,
              pressed && styles.pressedAction,
              isSubmitting && styles.disabledAction,
            ]}
          >
            <Text style={styles.secondaryActionText}>Cancel</Text>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting || normalizedName.length === 0}
          onPress={() => void onSave(normalizedName)}
          style={({ pressed }) => [
            styles.primaryAction,
            pressed && styles.primaryActionPressed,
            (isSubmitting || normalizedName.length === 0) &&
              styles.disabledAction,
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.primaryActionText}>{actionLabel}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(colors: LocationSectionColors) {
  return StyleSheet.create({
    card: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.cardBackground,
      padding: 18,
      gap: 14,
    },
    title: {
      color: colors.title,
      fontSize: 18,
      fontWeight: "700",
    },
    input: {
      height: 52,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.searchInputBorder,
      backgroundColor: colors.searchInputBackground,
      color: colors.searchInputText,
      fontSize: 15,
      paddingHorizontal: 14,
    },
    actions: {
      flexDirection: "row",
      gap: 10,
    },
    primaryAction: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
      backgroundColor: colors.chipActiveBackground,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    primaryActionPressed: {
      opacity: 0.9,
    },
    primaryActionText: {
      color: colors.chipActiveText,
      fontSize: 14,
      fontWeight: "700",
    },
    secondaryAction: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.secondaryButtonBorder,
      backgroundColor: colors.secondaryButtonBackground,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    secondaryActionText: {
      color: colors.secondaryButtonText,
      fontSize: 14,
      fontWeight: "700",
    },
    pressedAction: {
      opacity: 0.82,
    },
    disabledAction: {
      opacity: 0.58,
    },
  });
}
