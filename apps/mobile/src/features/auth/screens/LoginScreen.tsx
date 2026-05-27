// src/features/auth/screens/LoginScreen.tsx

import { useState } from "react";
import {
  Alert,
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

export function LoginScreen() {
  const setSession = useAuthStore((state) => state.setSession);
  const markDiscoveryProgressUpdated = useDiscoveryProgressStore(
    (state) => state.markUpdated,
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    try {
      const response = await loginUser({
        email: email.trim(),
        password,
      });

      await setSession(response.user, response.accessToken);

      try {
        await rehydrateDiscoveryProgressFromBackend(response.user.id);
        markDiscoveryProgressUpdated();
      } catch {
        // Keep the user signed in even if progress rehydration fails.
      }

      router.replace("/map");
    } catch (error) {
      Alert.alert(
        "Login failed",
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

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
        placeholderTextColor="gray"
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        placeholderTextColor="gray"
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    gap: 14,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    color: "#111827",
  },
  button: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
  },
  linkText: {
    textAlign: "center",
    fontWeight: "600",
    color: "#2563eb",
  },
});
