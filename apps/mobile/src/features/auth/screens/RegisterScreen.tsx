import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { registerUser } from "@/src/features/auth/api/authApi";
import { useAuthStore } from "@/src/features/auth/store/authStore";
import { getApiErrorMessage } from "@/src/shared/api/apiError";
import { InlineFeedbackCard } from "@/src/shared/components/InlineFeedbackCard";
import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";
import {
  useLegalDocuments,
} from "@/src/features/settings/content/legalDocuments";
import { SettingsDocumentModal } from "@/src/features/settings/components/SettingsDocumentModal";

type ActiveLegalDocument = "privacy" | "terms" | null;

export function RegisterScreen() {
  const setSession = useAuthStore((state) => state.setSession);
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () => getRegisterColors(colorScheme === "dark"),
    [colorScheme],
  );
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { privacyPolicyDocument, termsDocument } = useLegalDocuments();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeDocument, setActiveDocument] =
    useState<ActiveLegalDocument>(null);

  const canSubmit = termsAccepted && privacyPolicyAccepted && !isSubmitting;
  const visibleDocument =
    activeDocument === "terms"
      ? termsDocument
      : activeDocument === "privacy"
        ? privacyPolicyDocument
        : null;

  async function handleRegister() {
    if (!termsAccepted || !privacyPolicyAccepted) {
      setFormError(
        "Please accept the Terms and Conditions and Privacy Policy to register.",
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await registerUser({
        name,
        email: email.trim(),
        password,
        termsAccepted: true,
        privacyPolicyAccepted: true,
      });

      setFormError(null);
      await setSession(response.user, response.accessToken);
      router.replace("/map");
    } catch (error) {
      setFormError(
        getApiErrorMessage(error, "Please check your details and try again."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleToggleTermsAccepted() {
    setTermsAccepted((currentValue) => !currentValue);
    setFormError(null);
  }

  function handleTogglePrivacyPolicyAccepted() {
    setPrivacyPolicyAccepted((currentValue) => !currentValue);
    setFormError(null);
  }

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>
          Create your account and continue into the app.
        </Text>

        {formError ? <InlineFeedbackCard message={formError} /> : null}

        <TextInput
          value={name}
          onChangeText={(value) => {
            setName(value);
            setFormError(null);
          }}
          style={styles.input}
          placeholder="Name"
          placeholderTextColor={colors.inputPlaceholder}
        />
        <TextInput
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setFormError(null);
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.inputPlaceholder}
        />
        <TextInput
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setFormError(null);
          }}
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.inputPlaceholder}
          secureTextEntry
        />

        <View style={styles.checkboxGroup}>
          <View style={styles.checkboxRow}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: termsAccepted }}
              onPress={handleToggleTermsAccepted}
              style={({ pressed }) => [
                styles.checkbox,
                termsAccepted && styles.checkboxChecked,
                pressed && styles.checkboxPressed,
              ]}
            >
              {termsAccepted ? (
                <Ionicons
                  color={colors.checkboxCheck}
                  name="checkmark"
                  size={16}
                />
              ) : null}
            </Pressable>

            <Text style={styles.checkboxText}>
              I agree to the{" "}
              <Text
                accessibilityRole="link"
                onPress={() => setActiveDocument("terms")}
                style={styles.inlineLink}
              >
                Terms and Conditions
              </Text>
            </Text>
          </View>

          <View style={styles.checkboxRow}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: privacyPolicyAccepted }}
              onPress={handleTogglePrivacyPolicyAccepted}
              style={({ pressed }) => [
                styles.checkbox,
                privacyPolicyAccepted && styles.checkboxChecked,
                pressed && styles.checkboxPressed,
              ]}
            >
              {privacyPolicyAccepted ? (
                <Ionicons
                  color={colors.checkboxCheck}
                  name="checkmark"
                  size={16}
                />
              ) : null}
            </Pressable>

            <Text style={styles.checkboxText}>
              I agree to the{" "}
              <Text
                accessibilityRole="link"
                onPress={() => setActiveDocument("privacy")}
                style={styles.inlineLink}
              >
                Privacy Policy
              </Text>
            </Text>
          </View>
        </View>

        <Pressable
          disabled={!canSubmit}
          onPress={() => void handleRegister()}
          style={({ pressed }) => [
            styles.button,
            !canSubmit && styles.buttonDisabled,
            pressed && canSubmit && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>Register</Text>
        </Pressable>

        <Pressable onPress={() => router.push("/(auth)/login")}>
          <Text style={styles.linkText}>Already have an account? Log in</Text>
        </Pressable>
      </View>

      <SettingsDocumentModal
        document={visibleDocument}
        onClose={() => setActiveDocument(null)}
        visible={visibleDocument !== null}
      />
    </>
  );
}

function getRegisterColors(isDark: boolean) {
  if (isDark) {
    return {
      background: "#020617",
      title: "#F8FAFC",
      subtitle: "#CBD5E1",
      inputBackground: "#0F172A",
      inputBorder: "#334155",
      inputText: "#F8FAFC",
      inputPlaceholder: "#94A3B8",
      checkboxBorder: "#475569",
      checkboxBackground: "#111827",
      checkboxCheckedBackground: "#0F766E",
      checkboxCheck: "#FFFFFF",
      checkboxText: "#CBD5E1",
      linkText: "#5EEAD4",
      buttonBackground: "#0F766E",
      buttonPressed: "#115E59",
      buttonDisabled: "#134E4A",
      buttonText: "#FFFFFF",
      loginLink: "#5EEAD4",
    };
  }

  return {
    background: "#FFFFFF",
    title: "#111827",
    subtitle: "#6B7280",
    inputBackground: "#F9FAFB",
    inputBorder: "#D1D5DB",
    inputText: "#111827",
    inputPlaceholder: "#6B7280",
    checkboxBorder: "#CBD5E1",
    checkboxBackground: "#FFFFFF",
    checkboxCheckedBackground: "#111827",
    checkboxCheck: "#FFFFFF",
    checkboxText: "#374151",
    linkText: "#2563EB",
    buttonBackground: "#111827",
    buttonPressed: "#1F2937",
    buttonDisabled: "#9CA3AF",
    buttonText: "#FFFFFF",
    loginLink: "#2563EB",
  };
}

function createStyles(colors: ReturnType<typeof getRegisterColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      padding: 24,
      gap: 16,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 30,
      fontWeight: "700",
      color: colors.title,
    },
    subtitle: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.subtitle,
    },
    input: {
      height: 48,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 12,
      paddingHorizontal: 14,
      backgroundColor: colors.inputBackground,
      color: colors.inputText,
    },
    checkboxGroup: {
      gap: 12,
    },
    checkboxRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: colors.checkboxBorder,
      backgroundColor: colors.checkboxBackground,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 1,
    },
    checkboxChecked: {
      borderColor: colors.checkboxCheckedBackground,
      backgroundColor: colors.checkboxCheckedBackground,
    },
    checkboxPressed: {
      opacity: 0.82,
    },
    checkboxText: {
      flex: 1,
      color: colors.checkboxText,
      fontSize: 14,
      lineHeight: 20,
    },
    inlineLink: {
      color: colors.linkText,
      fontWeight: "700",
    },
    button: {
      height: 48,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.buttonBackground,
    },
    buttonPressed: {
      backgroundColor: colors.buttonPressed,
    },
    buttonDisabled: {
      backgroundColor: colors.buttonDisabled,
    },
    buttonText: {
      color: colors.buttonText,
      fontWeight: "700",
    },
    linkText: {
      textAlign: "center",
      fontWeight: "600",
      color: colors.loginLink,
    },
  });
}
