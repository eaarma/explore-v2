import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLogoutFlow } from "@/src/features/auth/hooks/useLogoutFlow";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { UnsyncedLogoutModal } from "@/src/shared/components/UnsyncedLogoutModal";

export function HeaderMoreMenu() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  const {
    cancelUnsyncedLogout,
    confirmUnsyncedLogout,
    isLoggingOut,
    isUnsyncedLogoutModalVisible,
    requestLogout,
  } = useLogoutFlow();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  async function handleLogout() {
    setIsOpen(false);
    await requestLogout();
  }

  function handleSettingsPress() {
    setIsOpen(false);

    if (pathname !== "/settings") {
      router.push("/settings");
    }
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open more menu"
        onPress={() => setIsOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          pressed && styles.triggerPressed,
        ]}
      >
        <Ionicons color="#2563EB" name="ellipsis-horizontal" size={22} />
      </Pressable>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
        transparent
        visible={isOpen}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close more menu"
          onPress={() => setIsOpen(false)}
          style={styles.backdrop}
        >
          <View
            style={[
              styles.menu,
              {
                top: insets.top + (Platform.OS === "ios" ? 52 : 60),
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              onPress={handleSettingsPress}
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed,
              ]}
            >
              <Text style={styles.menuItemText}>Settings</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed,
              ]}
            >
              <Text style={[styles.menuItemText, styles.logoutText]}>
                Logout
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <UnsyncedLogoutModal
        visible={isUnsyncedLogoutModalVisible}
        isSubmitting={isLoggingOut}
        onCancel={cancelUnsyncedLogout}
        onConfirm={confirmUnsyncedLogout}
      />
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 40,
    height: 34,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  triggerPressed: {
    backgroundColor: "#E2E8F0",
  },
  backdrop: {
    flex: 1,
  },
  menu: {
    position: "absolute",
    right: 12,
    width: 176,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 14,
    },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemPressed: {
    backgroundColor: "#F1F5F9",
  },
  menuItemText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "600",
  },
  logoutText: {
    color: "#B91C1C",
  },
});
