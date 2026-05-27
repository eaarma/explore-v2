import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";

type UnsyncedLogoutModalProps = {
  visible: boolean;
  isSubmitting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function UnsyncedLogoutModal({
  visible,
  isSubmitting = false,
  onCancel,
  onConfirm,
}: UnsyncedLogoutModalProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={() => {
        if (!isSubmitting) {
          onCancel();
        }
      }}
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Unsynced discoveries</Text>
          <Text style={styles.body}>
            Some of your discoveries have not been saved online yet. Connect to
            the internet before logging out to make sure your progress is
            preserved.
          </Text>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={onCancel}
              style={({ pressed }) => [
                styles.secondaryAction,
                pressed && styles.secondaryActionPressed,
                isSubmitting && styles.disabledAction,
              ]}
            >
              <Text style={styles.secondaryActionText}>Cancel</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.primaryAction,
                pressed && styles.primaryActionPressed,
                isSubmitting && styles.disabledAction,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryActionText}>Logout anyway</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.42)",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    backgroundColor: "#FEFCF8",
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
  title: {
    color: "#0F172A",
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
  },
  body: {
    color: "#475569",
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
    backgroundColor: "#B91C1C",
    paddingHorizontal: 16,
  },
  primaryActionPressed: {
    backgroundColor: "#991B1B",
  },
  primaryActionText: {
    color: "#FFFFFF",
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
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
  },
  secondaryActionPressed: {
    backgroundColor: "#F8FAFC",
  },
  secondaryActionText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700",
  },
  disabledAction: {
    opacity: 0.72,
  },
});
