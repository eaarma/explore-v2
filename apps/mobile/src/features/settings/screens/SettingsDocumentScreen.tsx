import { Redirect } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";

import {
  SettingsDocumentContent,
  type SettingsDocument,
} from "@/src/features/settings/components/SettingsDocumentContent";
import { useAuthStore } from "@/src/features/auth/store/authStore";
import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";

export function SettingsDocumentScreen(document: SettingsDocument) {
  const status = useAuthStore((state) => state.status);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  if (status === "checking") {
    return <Redirect href="/startup" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/startup" />;
  }

  return (
    <ScrollView
      style={[
        styles.container,
        {
          backgroundColor: isDark ? "#020617" : "#F8FAFC",
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <SettingsDocumentContent document={document} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
