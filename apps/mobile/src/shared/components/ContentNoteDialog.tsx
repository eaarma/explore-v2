import { useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { getActiveStateColors } from "@/src/shared/constants/activeStateColors";
import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";

type ContentNoteDialogProps = {
  visible: boolean;
  title: string;
  note: unknown;
  onClose: () => void;
};

export function ContentNoteDialog({
  visible,
  title,
  note,
  onClose,
}: ContentNoteDialogProps) {
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () => getContentNoteDialogColors(colorScheme === "dark"),
    [colorScheme],
  );
  const styles = useMemo(() => createStyles(colors), [colors]);
  const noteBody = getNormalizedNoteBody(note);

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Note</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{noteBody}</Text>

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.action,
              pressed && styles.actionPressed,
            ]}
          >
            <Text style={styles.actionText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export function hasContentNote(note: unknown) {
  if (typeof note === "string") {
    return note.trim().length > 0;
  }

  if (typeof note === "number" && Number.isFinite(note)) {
    return note !== 0;
  }

  return false;
}

function getNormalizedNoteBody(note: unknown) {
  if (typeof note === "string") {
    const trimmedNote = note.trim();

    if (trimmedNote.length > 0) {
      return trimmedNote;
    }
  }

  if (typeof note === "number" && Number.isFinite(note)) {
    return String(note);
  }

  return "No note added yet.";
}

function getContentNoteDialogColors(isDark: boolean) {
  const activeStateColors = getActiveStateColors(isDark);

  if (isDark) {
    return {
      backdrop: "rgba(2, 6, 23, 0.7)",
      surface: "#0F172A",
      border: "#1E293B",
      title: "#F8FAFC",
      body: "#CBD5E1",
      accent: activeStateColors.tint,
      buttonBackground: activeStateColors.buttonBackground,
      buttonText: activeStateColors.text,
    };
  }

  return {
    backdrop: "rgba(15, 23, 42, 0.42)",
    surface: "#FEFCF8",
    border: "#E7E1D7",
    title: "#0F172A",
    body: "#475569",
    accent: activeStateColors.tint,
    buttonBackground: activeStateColors.buttonBackground,
    buttonText: activeStateColors.text,
  };
}

function createStyles(colors: ReturnType<typeof getContentNoteDialogColors>) {
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
      maxWidth: 380,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 22,
      gap: 14,
      shadowColor: "#0F172A",
      shadowOffset: {
        width: 0,
        height: 16,
      },
      shadowOpacity: 0.18,
      shadowRadius: 28,
      elevation: 14,
    },
    eyebrow: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.4,
      textTransform: "uppercase",
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
      lineHeight: 23,
    },
    action: {
      minHeight: 46,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
      backgroundColor: colors.buttonBackground,
      marginTop: 4,
      paddingHorizontal: 16,
    },
    actionPressed: {
      opacity: 0.88,
    },
    actionText: {
      color: colors.buttonText,
      fontSize: 15,
      fontWeight: "700",
    },
  });
}
