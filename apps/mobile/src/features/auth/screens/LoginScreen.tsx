// src/features/auth/screens/LoginScreen.tsx

import { useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { loginUser } from "@/src/features/auth/api/authApi";
import { useDiscoveryProgressStore } from "@/src/features/discoveries/store/discoveryProgressStore";
import { rehydrateDiscoveryProgressFromBackend } from "@/src/features/discoveries/sync/discoveryProgressRehydration";
import { useAuthStore } from "@/src/features/auth/store/authStore";
import { getApiErrorMessage } from "@/src/shared/api/apiError";
import { InlineFeedbackCard } from "@/src/shared/components/InlineFeedbackCard";
import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";

export function LoginScreen() {
  const setSession = useAuthStore((state) => state.setSession);
  const markDiscoveryProgressUpdated = useDiscoveryProgressStore(
    (state) => state.markUpdated,
  );
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () => getLoginColors(colorScheme === "dark"),
    [colorScheme],
  );
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  async function handleLogin() {
    try {
      const response = await loginUser({
        email: email.trim(),
        password,
      });

      await setSession(response.user, response.accessToken);
      setFormError(null);

      try {
        await rehydrateDiscoveryProgressFromBackend(response.user.id);
        markDiscoveryProgressUpdated();
      } catch {
        // Keep the user signed in even if progress rehydration fails.
      }

      router.replace("/map");
    } catch (error) {
      setFormError(
        getApiErrorMessage(
          error,
          "Please check your credentials and try again.",
        ),
      );
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      {formError ? <InlineFeedbackCard message={formError} /> : null}

      <TextInput
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          setFormError(null);
        }}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
        placeholderTextColor={colors.inputPlaceholder}
      />

      <TextInput
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          setFormError(null);
        }}
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        placeholderTextColor={colors.inputPlaceholder}
      />

      <Pressable style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/(auth)/register")}>
        <Text style={styles.linkText}>Create a new account</Text>
      </Pressable>
    </View>
  );
}

function getLoginColors(isDark: boolean) {
  if (isDark) {
    return {
      background: "#020617",
      title: "#F8FAFC",
      inputBackground: "#0F172A",
      inputBorder: "#334155",
      inputText: "#F8FAFC",
      inputPlaceholder: "#94A3B8",
      buttonBackground: "#0F766E",
      buttonText: "#FFFFFF",
      linkText: "#5EEAD4",
    };
  }

  return {
    background: "#FFFFFF",
    title: "#111827",
    inputBackground: "#F9FAFB",
    inputBorder: "#D1D5DB",
    inputText: "#111827",
    inputPlaceholder: "#6B7280",
    buttonBackground: "#111827",
    buttonText: "#FFFFFF",
    linkText: "#2563EB",
  };
}

function createStyles(colors: ReturnType<typeof getLoginColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: 24,
      justifyContent: "center",
      gap: 14,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 32,
      fontWeight: "700",
      color: colors.title,
    },
    input: {
      height: 48,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 12,
      paddingHorizontal: 12,
      backgroundColor: colors.inputBackground,
      color: colors.inputText,
    },
    button: {
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.buttonBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonText: {
      color: colors.buttonText,
      fontWeight: "700",
    },
    linkText: {
      textAlign: "center",
      fontWeight: "600",
      color: colors.linkText,
    },
  });
}
