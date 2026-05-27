import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";

type AccountSettingsDialogProps = {
  currentName: string;
  isOfflineSession: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onDeleteUser: () => void | Promise<void>;
  onSaveName: (name: string) => void | Promise<void>;
  visible: boolean;
};

type DialogMode = "menu" | "edit-name" | "delete-user";

export function AccountSettingsDialog({
  currentName,
  isOfflineSession,
  isSubmitting = false,
  onClose,
  onDeleteUser,
  onSaveName,
  visible,
}: AccountSettingsDialogProps) {
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () => getDialogColors(colorScheme === "dark"),
    [colorScheme],
  );
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [mode, setMode] = useState<DialogMode>("menu");
  const [pendingName, setPendingName] = useState(currentName);
  const [hasConfirmedDelete, setHasConfirmedDelete] = useState(false);

  useEffect(() => {
    if (!visible) {
      setMode("menu");
      setPendingName(currentName);
      setHasConfirmedDelete(false);
    }
  }, [currentName, visible]);

  const normalizedPendingName = pendingName.trim();
  const normalizedCurrentName = currentName.trim();
  const canSaveName =
    !isOfflineSession &&
    !isSubmitting &&
    normalizedPendingName.length > 0 &&
    normalizedPendingName !== normalizedCurrentName;
  const canDeleteUser =
    !isOfflineSession && !isSubmitting && hasConfirmedDelete;

  async function handleSaveName() {
    if (!canSaveName) {
      return;
    }

    await onSaveName(normalizedPendingName);
  }

  async function handleDeleteUser() {
    if (!canDeleteUser) {
      return;
    }

    await onDeleteUser();
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={() => {
        if (!isSubmitting) {
          onClose();
        }
      }}
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {mode === "menu" ? (
            <>
              <Text style={styles.title}>Account settings</Text>
              <Text style={styles.body}>
                Manage your username or permanently delete this user account.
              </Text>

              {isOfflineSession ? (
                <View style={styles.noticeCard}>
                  <Text style={styles.noticeText}>
                    These account actions require an online session.
                  </Text>
                </View>
              ) : null}

              <View style={styles.optionStack}>
                <Pressable
                  accessibilityRole="button"
                  disabled={isSubmitting}
                  onPress={() => setMode("edit-name")}
                  style={({ pressed }) => [
                    styles.optionButton,
                    pressed && styles.pressedButton,
                    isSubmitting && styles.disabledAction,
                  ]}
                >
                  <View style={styles.optionCopy}>
                    <Text style={styles.optionTitle}>Edit username</Text>
                    <Text style={styles.optionMeta}>
                      Change the name shown in your profile.
                    </Text>
                  </View>
                  <Ionicons
                    color={colors.optionIcon}
                    name="chevron-forward"
                    size={18}
                  />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  disabled={isSubmitting}
                  onPress={() => setMode("delete-user")}
                  style={({ pressed }) => [
                    styles.optionButton,
                    styles.deleteOptionButton,
                    pressed && styles.pressedButton,
                    isSubmitting && styles.disabledAction,
                  ]}
                >
                  <View style={styles.optionCopy}>
                    <Text style={styles.deleteOptionTitle}>Delete user</Text>
                    <Text style={styles.optionMeta}>
                      Permanently remove your account and its saved progress.
                    </Text>
                  </View>
                  <Ionicons
                    color={colors.deleteText}
                    name="trash-outline"
                    size={18}
                  />
                </Pressable>
              </View>
            </>
          ) : null}

          {mode === "edit-name" ? (
            <>
              <Text style={styles.title}>Edit username</Text>
              <Text style={styles.body}>
                Update the name that appears in your profile summary.
              </Text>

              {isOfflineSession ? (
                <View style={styles.noticeCard}>
                  <Text style={styles.noticeText}>
                    Reconnect to the internet before updating your username.
                  </Text>
                </View>
              ) : null}

              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Username</Text>
                <TextInput
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isSubmitting}
                  onChangeText={setPendingName}
                  placeholder="Username"
                  placeholderTextColor={colors.inputPlaceholder}
                  style={styles.input}
                  value={pendingName}
                />
              </View>
            </>
          ) : null}

          {mode === "delete-user" ? (
            <>
              <Text style={styles.title}>Delete user</Text>
              <Text style={styles.body}>
                This permanently deletes your account, trips, and saved
                discovery progress.
              </Text>

              <View style={styles.deleteWarningCard}>
                <Text style={styles.deleteWarningTitle}>
                  This action cannot be undone.
                </Text>
                <Text style={styles.deleteWarningText}>
                  Make sure you really want to remove this user before
                  confirming below.
                </Text>
              </View>

              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: hasConfirmedDelete }}
                disabled={isSubmitting || isOfflineSession}
                onPress={() =>
                  setHasConfirmedDelete((currentValue) => !currentValue)
                }
                style={({ pressed }) => [
                  styles.checkboxRow,
                  pressed && styles.pressedButton,
                  (isSubmitting || isOfflineSession) && styles.disabledAction,
                ]}
              >
                <View
                  style={[
                    styles.checkbox,
                    hasConfirmedDelete && styles.checkboxChecked,
                  ]}
                >
                  {hasConfirmedDelete ? (
                    <Ionicons
                      color={colors.checkboxCheck}
                      name="checkmark"
                      size={16}
                    />
                  ) : null}
                </View>
                <Text style={styles.checkboxText}>
                  I understand this will permanently delete the user.
                </Text>
              </Pressable>

              {isOfflineSession ? (
                <View style={styles.noticeCard}>
                  <Text style={styles.noticeText}>
                    Reconnect to the internet before deleting your account.
                  </Text>
                </View>
              ) : null}
            </>
          ) : null}

          <View style={styles.actionRow}>
            {mode !== "menu" ? (
              <Pressable
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={() => setMode("menu")}
                style={({ pressed }) => [
                  styles.secondaryAction,
                  pressed && styles.pressedButton,
                  isSubmitting && styles.disabledAction,
                ]}
              >
                <Text style={styles.secondaryActionText}>Back</Text>
              </Pressable>
            ) : null}

            {mode === "menu" ? (
              <Pressable
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={onClose}
                style={({ pressed }) => [
                  styles.secondaryAction,
                  pressed && styles.pressedButton,
                  isSubmitting && styles.disabledAction,
                ]}
              >
                <Text style={styles.secondaryActionText}>Close</Text>
              </Pressable>
            ) : null}

            {mode === "edit-name" ? (
              <Pressable
                accessibilityRole="button"
                disabled={!canSaveName}
                onPress={() => void handleSaveName()}
                style={({ pressed }) => [
                  styles.primaryAction,
                  pressed && styles.pressedButton,
                  !canSaveName && styles.disabledAction,
                ]}
              >
                <Text style={styles.primaryActionText}>Save</Text>
              </Pressable>
            ) : null}

            {mode === "delete-user" ? (
              <Pressable
                accessibilityRole="button"
                disabled={!canDeleteUser}
                onPress={() => void handleDeleteUser()}
                style={({ pressed }) => [
                  styles.deleteAction,
                  pressed && styles.pressedButton,
                  !canDeleteUser && styles.disabledAction,
                ]}
              >
                <Text style={styles.deleteActionText}>Confirm delete</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function getDialogColors(isDark: boolean) {
  if (isDark) {
    return {
      backdrop: "rgba(2, 6, 23, 0.66)",
      cardBackground: "#0F172A",
      cardBorder: "#1E293B",
      title: "#F8FAFC",
      body: "#CBD5E1",
      muted: "#94A3B8",
      noticeBackground: "#111827",
      noticeBorder: "#334155",
      noticeText: "#E2E8F0",
      optionBackground: "#111827",
      optionBorder: "#1E293B",
      optionIcon: "#94A3B8",
      inputBackground: "#111827",
      inputBorder: "#334155",
      inputText: "#F8FAFC",
      inputPlaceholder: "#64748B",
      primaryBackground: "#115E59",
      primaryText: "#FFFFFF",
      secondaryBackground: "#111827",
      secondaryBorder: "#334155",
      secondaryText: "#E2E8F0",
      deleteBackground: "#450A0A",
      deleteBorder: "#7F1D1D",
      deleteText: "#FCA5A5",
      checkboxBorder: "#475569",
      checkboxBackground: "#111827",
      checkboxCheckedBackground: "#B91C1C",
      checkboxCheck: "#FFFFFF",
    };
  }

  return {
    backdrop: "rgba(15, 23, 42, 0.48)",
    cardBackground: "#FEFCF8",
    cardBorder: "#E7E1D7",
    title: "#0F172A",
    body: "#475569",
    muted: "#64748B",
    noticeBackground: "#F8FAFC",
    noticeBorder: "#D7E0EA",
    noticeText: "#334155",
    optionBackground: "#FFFFFF",
    optionBorder: "#E7E1D7",
    optionIcon: "#64748B",
    inputBackground: "#FFFFFF",
    inputBorder: "#D7E0EA",
    inputText: "#0F172A",
    inputPlaceholder: "#94A3B8",
    primaryBackground: "#0F766E",
    primaryText: "#FFFFFF",
    secondaryBackground: "#FFFFFF",
    secondaryBorder: "#CBD5E1",
    secondaryText: "#334155",
    deleteBackground: "#FFF1F2",
    deleteBorder: "#FCA5A5",
    deleteText: "#B91C1C",
    checkboxBorder: "#CBD5E1",
    checkboxBackground: "#FFFFFF",
    checkboxCheckedBackground: "#DC2626",
    checkboxCheck: "#FFFFFF",
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
      maxWidth: 390,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.cardBackground,
      padding: 20,
      gap: 14,
      shadowColor: "#020617",
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
    noticeCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.noticeBorder,
      backgroundColor: colors.noticeBackground,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    noticeText: {
      color: colors.noticeText,
      fontSize: 14,
      lineHeight: 20,
    },
    optionStack: {
      gap: 10,
    },
    optionButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.optionBorder,
      backgroundColor: colors.optionBackground,
      padding: 14,
    },
    deleteOptionButton: {
      borderColor: colors.deleteBorder,
    },
    optionCopy: {
      flex: 1,
      gap: 4,
    },
    optionTitle: {
      color: colors.title,
      fontSize: 16,
      fontWeight: "700",
    },
    deleteOptionTitle: {
      color: colors.deleteText,
      fontSize: 16,
      fontWeight: "700",
    },
    optionMeta: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
    },
    formGroup: {
      gap: 8,
    },
    fieldLabel: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    input: {
      height: 52,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      backgroundColor: colors.inputBackground,
      color: colors.inputText,
      fontSize: 16,
      paddingHorizontal: 14,
    },
    deleteWarningCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.deleteBorder,
      backgroundColor: colors.deleteBackground,
      padding: 14,
      gap: 6,
    },
    deleteWarningTitle: {
      color: colors.deleteText,
      fontSize: 15,
      fontWeight: "700",
    },
    deleteWarningText: {
      color: colors.body,
      fontSize: 14,
      lineHeight: 20,
    },
    checkboxRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: colors.checkboxBorder,
      backgroundColor: colors.checkboxBackground,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 1,
    },
    checkboxChecked: {
      borderColor: colors.checkboxCheckedBackground,
      backgroundColor: colors.checkboxCheckedBackground,
    },
    checkboxText: {
      flex: 1,
      color: colors.body,
      fontSize: 14,
      lineHeight: 20,
    },
    actionRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 10,
      marginTop: 4,
    },
    primaryAction: {
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
      backgroundColor: colors.primaryBackground,
      paddingHorizontal: 18,
      paddingVertical: 14,
      minWidth: 108,
    },
    primaryActionText: {
      color: colors.primaryText,
      fontSize: 14,
      fontWeight: "700",
    },
    secondaryAction: {
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.secondaryBorder,
      backgroundColor: colors.secondaryBackground,
      paddingHorizontal: 18,
      paddingVertical: 14,
      minWidth: 108,
    },
    secondaryActionText: {
      color: colors.secondaryText,
      fontSize: 14,
      fontWeight: "700",
    },
    deleteAction: {
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.deleteBorder,
      backgroundColor: colors.deleteBackground,
      paddingHorizontal: 18,
      paddingVertical: 14,
      minWidth: 132,
    },
    deleteActionText: {
      color: colors.deleteText,
      fontSize: 14,
      fontWeight: "700",
    },
    pressedButton: {
      opacity: 0.86,
    },
    disabledAction: {
      opacity: 0.55,
    },
  });
}
