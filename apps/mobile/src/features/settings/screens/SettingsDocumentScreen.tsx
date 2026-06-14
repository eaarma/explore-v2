import { ScrollView, StyleSheet } from "react-native";

import {
  SettingsDocumentContent,
  type SettingsDocument,
} from "@/src/features/settings/components/SettingsDocumentContent";
import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";

export function SettingsDocumentScreen(document: SettingsDocument) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

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
