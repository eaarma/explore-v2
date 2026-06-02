import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import {
  SettingsDocumentContent,
  type SettingsDocument,
} from "@/src/features/settings/components/SettingsDocumentContent";
import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";

type SettingsDocumentModalProps = {
  document: SettingsDocument | null;
  onClose: () => void;
  visible: boolean;
};

export function SettingsDocumentModal({
  document,
  onClose,
  visible,
}: SettingsDocumentModalProps) {
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () => getModalColors(colorScheme === "dark"),
    [colorScheme],
  );
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />

        <View style={styles.card}>
          <View style={styles.topBar}>
            <Pressable
              accessibilityLabel="Close document"
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
              ]}
            >
              <Ionicons color={colors.closeIcon} name="close" size={20} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}
          >
            {document ? <SettingsDocumentContent document={document} /> : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function getModalColors(isDark: boolean) {
  if (isDark) {
    return {
      backdrop: "rgba(2, 6, 23, 0.72)",
      cardBackground: "#020617",
      cardBorder: "#1E293B",
      closeBackground: "#0F172A",
      closePressed: "#1E293B",
      closeIcon: "#E2E8F0",
    };
  }

  return {
    backdrop: "rgba(15, 23, 42, 0.48)",
    cardBackground: "#F8FAFC",
    cardBorder: "#CBD5E1",
    closeBackground: "#FFFFFF",
    closePressed: "#F1F5F9",
    closeIcon: "#334155",
  };
}

function createStyles(colors: ReturnType<typeof getModalColors>) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
      backgroundColor: colors.backdrop,
    },
    card: {
      width: "100%",
      alignSelf: "center",
      maxWidth: 720,
      height: "90%",
      borderRadius: 28,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.cardBackground,
      overflow: "hidden",
    },
    topBar: {
      alignItems: "flex-end",
      paddingTop: 14,
      paddingRight: 14,
    },
    closeButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.closeBackground,
    },
    closeButtonPressed: {
      backgroundColor: colors.closePressed,
    },
    scrollView: {
      flex: 1,
    },
  });
}
