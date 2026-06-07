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
import { useAuthStore } from "@/src/features/auth/store/authStore";
import { ACTIVE_STATE_ACCENT } from "@/src/shared/constants/activeStateColors";
import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { UnsyncedLogoutModal } from "@/src/shared/components/UnsyncedLogoutModal";

type HeaderMoreMenuAction = {
  label: string;
  onPress: () => void;
  textColor?: string;
};

type HeaderMoreMenuProps = {
  actions?: HeaderMoreMenuAction[];
};

export function HeaderMoreMenu({ actions = [] }: HeaderMoreMenuProps) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const userRole = useAuthStore((state) => state.user?.role);
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

  function handleAdminPress() {
    setIsOpen(false);

    if (pathname !== "/admin") {
      router.push("/admin");
    }
  }

  function handleActionPress(action: HeaderMoreMenuAction) {
    setIsOpen(false);
    action.onPress();
  }

  function renderActionItem(action: HeaderMoreMenuAction) {
    return (
      <Pressable
        key={action.label}
        accessibilityRole="button"
        onPress={() => handleActionPress(action)}
        style={({ pressed }) => [
          styles.menuItem,
          pressed && {
            backgroundColor: pressedBackgroundColor,
          },
        ]}
      >
        <Text
          style={[
            styles.menuItemText,
            {
              color: action.textColor ?? menuItemTextColor,
            },
          ]}
        >
          {action.label}
        </Text>
      </Pressable>
    );
  }

  const triggerIconColor = ACTIVE_STATE_ACCENT;
  const menuBackgroundColor = colorScheme === "dark" ? "#0F172A" : "#FFFFFF";
  const menuItemTextColor = colorScheme === "dark" ? "#F8FAFC" : "#0F172A";
  const pressedBackgroundColor =
    colorScheme === "dark" ? "#1E293B" : "#F1F5F9";
  const isAdmin = userRole === "ADMIN";

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
        <Ionicons
          color={triggerIconColor}
          name="ellipsis-horizontal"
          size={22}
        />
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
                backgroundColor: menuBackgroundColor,
              },
              {
                top: insets.top + (Platform.OS === "ios" ? 52 : 60),
              },
            ]}
          >
            {isAdmin ? (
              <Pressable
                accessibilityRole="button"
                onPress={handleAdminPress}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && {
                    backgroundColor: pressedBackgroundColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.menuItemText,
                    {
                      color: menuItemTextColor,
                    },
                  ]}
                >
                  Admin
                </Text>
              </Pressable>
            ) : null}

            {isAdmin ? actions.map(renderActionItem) : null}

            <Pressable
              accessibilityRole="button"
              onPress={handleSettingsPress}
              style={({ pressed }) => [
                styles.menuItem,
                pressed && {
                  backgroundColor: pressedBackgroundColor,
                },
              ]}
            >
              <Text
                style={[
                  styles.menuItemText,
                  {
                    color: menuItemTextColor,
                  },
                ]}
              >
                Settings
              </Text>
            </Pressable>

            {isAdmin ? null : actions.map(renderActionItem)}

            <Pressable
              accessibilityRole="button"
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.menuItem,
                pressed && {
                  backgroundColor: pressedBackgroundColor,
                },
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
    marginHorizontal: 6,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 12,
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
