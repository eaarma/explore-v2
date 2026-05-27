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
import { registerUser } from "@/src/features/auth/api/authApi";
import { useAuthStore } from "@/src/features/auth/store/authStore";
import { getApiErrorMessage } from "@/src/shared/api/apiError";

export function RegisterScreen() {
  const setSession = useAuthStore((state) => state.setSession);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleRegister() {
    try {
      const response = await registerUser({
        name,
        email: email.trim(),
        password,
      });

      await setSession(response.user, response.accessToken);
      router.replace("/map");
    } catch (error) {
      Alert.alert(
        "Registration failed",
        getApiErrorMessage(
          error,
          "Please check your details and try again.",
        ),
      );
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.subtitle}>
        Create your account and continue into the app.
      </Text>

      <TextInput
        value={name}
        onChangeText={setName}
        style={styles.input}
        placeholder="Full name"
      />
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
        placeholder="Email"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        placeholder="Password"
        secureTextEntry
      />

      <Pressable style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/(auth)/login")}>
        <Text style={styles.linkText}>Already have an account? Log in</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    gap: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#6b7280",
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "#f9fafb",
  },
  button: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
  linkText: {
    textAlign: "center",
    fontWeight: "600",
    color: "#2563eb",
  },
});
