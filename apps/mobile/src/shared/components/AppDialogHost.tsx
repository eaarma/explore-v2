import { useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { getActiveStateColors } from "@/src/shared/constants/activeStateColors";
import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";
import {
  hideAppDialog,
  useAppFeedbackStore,
  type AppDialogAction,
} from "@/src/shared/store/appFeedbackStore";

export function AppDialogHost() {
  const dialog = useAppFeedbackStore((state) => state.dialog);
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () => getDialogColors(colorScheme === "dark"),
    [colorScheme],
  );
  const styles = useMemo(() => createStyles(colors), [colors]);

  function handleDismiss() {
    if (!dialog?.dismissOnBackdropPress) {
      return;
    }

    hideAppDialog();
  }

  function handleActionPress(action?: AppDialogAction) {
    hideAppDialog();
    action?.onPress?.();
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={() => {
        if (dialog?.dismissOnBackdropPress) {
          hideAppDialog();
        }
      }}
      transparent
      visible={Boolean(dialog)}
    >
      <Pressable onPress={handleDismiss} style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{dialog?.title}</Text>
          <Text style={styles.body}>{dialog?.message}</Text>

          <View style={styles.actions}>
            {dialog?.secondaryAction ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => handleActionPress(dialog.secondaryAction)}
                style={({ pressed }) => [
                  styles.secondaryAction,
                  pressed && styles.secondaryActionPressed,
                ]}
              >
                <Text style={styles.secondaryActionText}>
                  {dialog.secondaryAction.label}
                </Text>
              </Pressable>
            ) : null}

            {dialog?.primaryAction ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => handleActionPress(dialog.primaryAction)}
                style={({ pressed }) => [
                  styles.primaryAction,
                  dialog.primaryAction.variant === "destructive" &&
                    styles.primaryActionDestructive,
                  pressed && styles.primaryActionPressed,
                  dialog.primaryAction.variant === "destructive" &&
                    pressed &&
                    styles.primaryActionDestructivePressed,
                  !dialog.secondaryAction && styles.primaryActionFullWidth,
                ]}
              >
                <Text style={styles.primaryActionText}>
                  {dialog.primaryAction.label}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

function getDialogColors(isDark: boolean) {
  const activeStateColors = getActiveStateColors(isDark);

  if (isDark) {
    return {
      backdrop: "rgba(2, 6, 23, 0.62)",
      cardBackground: "#0F172A",
      title: "#F8FAFC",
      body: "#CBD5E1",
      border: "#334155",
      secondaryBackground: "#111827",
      secondaryPressed: "#1E293B",
      secondaryText: "#E2E8F0",
      primaryBackground: activeStateColors.buttonBackground,
      primaryPressed: activeStateColors.buttonPressedBackground,
      destructiveBackground: "#B91C1C",
      destructivePressed: "#991B1B",
      primaryText: activeStateColors.text,
      shadow: "#020617",
    };
  }

  return {
    backdrop: "rgba(15, 23, 42, 0.42)",
    cardBackground: "#FEFCF8",
    title: "#0F172A",
    body: "#475569",
    border: "#CBD5E1",
    secondaryBackground: "#FFFFFF",
    secondaryPressed: "#F8FAFC",
    secondaryText: "#0F172A",
    primaryBackground: activeStateColors.buttonBackground,
    primaryPressed: activeStateColors.buttonPressedBackground,
    destructiveBackground: "#B91C1C",
    destructivePressed: "#991B1B",
    primaryText: activeStateColors.text,
    shadow: "#0F172A",
  };
}

function createStyles(colors: ReturnType<typeof getDialogColors>) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.backdrop,
      padding: 24,
    },
    card: {
      width: "100%",
      maxWidth: 360,
      borderRadius: 24,
      backgroundColor: colors.cardBackground,
      padding: 22,
      gap: 14,
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 16,
      },
      shadowOpacity: 0.18,
      shadowRadius: 28,
      elevation: 14,
    },
    title: {
      color: colors.title,
      fontSize: 22,
      fontWeight: "700",
      lineHeight: 28,
    },
    body: {
      color: colors.body,
      fontSize: 15,
      lineHeight: 22,
    },
    actions: {
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
      backgroundColor: colors.primaryBackground,
      paddingHorizontal: 16,
    },
    primaryActionPressed: {
      backgroundColor: colors.primaryPressed,
    },
    primaryActionDestructive: {
      backgroundColor: colors.destructiveBackground,
    },
    primaryActionDestructivePressed: {
      backgroundColor: colors.destructivePressed,
    },
    primaryActionFullWidth: {
      flexBasis: "100%",
    },
    primaryActionText: {
      color: colors.primaryText,
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
      borderColor: colors.border,
      backgroundColor: colors.secondaryBackground,
      paddingHorizontal: 16,
    },
    secondaryActionPressed: {
      backgroundColor: colors.secondaryPressed,
    },
    secondaryActionText: {
      color: colors.secondaryText,
      fontSize: 15,
      fontWeight: "700",
    },
  });
}
