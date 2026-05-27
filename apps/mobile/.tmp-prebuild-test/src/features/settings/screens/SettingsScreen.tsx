import { Redirect } from "expo-router";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useAuthStore } from "@/src/features/auth/store/authStore";

export function SettingsScreen() {
  const status = useAuthStore((state) => state.status);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (status === "checking") {
    return <Redirect href="/startup" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/startup" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Settings</Text>
        <Text style={styles.title}>Your preferences will live here.</Text>
        <Text style={styles.description}>
          This placeholder is wired up and ready for account controls, app
          preferences, and notification settings.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 24,
  },
  card: {
    marginTop: 24,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    padding: 24,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 14,
    },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  eyebrow: {
    marginBottom: 10,
    color: "#0F766E",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    color: "#0F172A",
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 38,
  },
  description: {
    marginTop: 14,
    color: "#475569",
    fontSize: 16,
    lineHeight: 24,
  },
});
