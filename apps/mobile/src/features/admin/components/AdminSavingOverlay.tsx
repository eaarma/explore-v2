import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";

type AdminSavingOverlayProps = {
  visible: boolean;
  title: string;
  message: string;
  colors: {
    surface: string;
    border: string;
    title: string;
    body: string;
  };
};

export function AdminSavingOverlay({
  visible,
  title,
  message,
  colors,
}: AdminSavingOverlayProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={() => {}}
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <ActivityIndicator color={colors.title} size="small" />
          <Text
            style={[
              styles.title,
              {
                color: colors.title,
              },
            ]}
          >
            {title}
          </Text>
          <Text
            style={[
              styles.message,
              {
                color: colors.body,
              },
            ]}
          >
            {message}
          </Text>
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
    maxWidth: 320,
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 22,
  },
  title: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
});
