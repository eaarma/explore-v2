import { ReactNode } from "react";
import { Redirect } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

import { AdminJourneysSection } from "@/src/features/admin/components/AdminJourneysSection";
import { AdminLocationsSection } from "@/src/features/admin/components/AdminLocationsSection";
import { AdminUsersSection } from "@/src/features/admin/components/AdminUsersSection";
import {
  AdminColors,
  getAdminScreenColors,
} from "@/src/features/admin/utils/adminScreenTheme";
import { useAuthStore } from "@/src/features/auth/store/authStore";
import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";

type AdminSectionScreenProps = {
  renderSection: (colors: AdminColors) => ReactNode;
  scrollable?: boolean;
};

function AdminSectionScreen({
  renderSection,
  scrollable = true,
}: AdminSectionScreenProps) {
  const status = useAuthStore((state) => state.status);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userRole = useAuthStore((state) => state.user?.role);
  const colorScheme = useColorScheme();
  const colors = getAdminScreenColors(colorScheme === "dark");

  if (status === "checking") {
    return <Redirect href="/startup" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/startup" />;
  }

  if (userRole !== "ADMIN") {
    return <Redirect href="/map" />;
  }

  if (!scrollable) {
    return (
      <View
        style={[
          styles.container,
          styles.contentView,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        {renderSection(colors)}
      </View>
    );
  }

  return (
    <ScrollView
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {renderSection(colors)}
    </ScrollView>
  );
}

export function AdminLocationsScreen() {
  return (
    <AdminSectionScreen
      renderSection={(colors) => <AdminLocationsSection colors={colors} />}
      scrollable={false}
    />
  );
}

export function AdminJourneysScreen() {
  return (
    <AdminSectionScreen
      renderSection={(colors) => <AdminJourneysSection colors={colors} />}
      scrollable={false}
    />
  );
}

export function AdminUsersScreen() {
  return (
    <AdminSectionScreen
      renderSection={(colors) => <AdminUsersSection colors={colors} />}
      scrollable={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    flexGrow: 1,
  },
  contentView: {
    padding: 0,
  },
});
