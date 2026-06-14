import type { ReactNode } from "react";
import { Redirect, Stack } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AdminSavingOverlay } from "@/src/features/admin/components/AdminSavingOverlay";
import { useAuthStore } from "@/src/features/auth/store/authStore";

type AdminDetailScreenShellProps = {
  title: string;
  colors: {
    background: string;
    surface: string;
    border: string;
    title: string;
    body: string;
    stateBorder?: string;
    stateCopy?: string;
  };
  isLoading: boolean;
  isSaving?: boolean;
  savingTitle?: string;
  savingCopy?: string;
  loadingTitle: string;
  loadingCopy: string;
  errorTitle: string;
  errorMessage: string | null;
  isReady: boolean;
  children: ReactNode;
};

export function AdminDetailScreenShell({
  title,
  colors,
  isLoading,
  isSaving = false,
  savingTitle = "Saving changes",
  savingCopy = "Please wait while we save your latest admin updates.",
  loadingTitle,
  loadingCopy,
  errorTitle,
  errorMessage,
  isReady,
  children,
}: AdminDetailScreenShellProps) {
  const status = useAuthStore((state) => state.status);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userRole = useAuthStore((state) => state.user?.role);

  if (status === "checking") {
    return <Redirect href="/startup" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/startup" />;
  }

  if (userRole !== "ADMIN") {
    return <Redirect href="/map" />;
  }

  const stateBorderColor = colors.stateBorder ?? colors.border;
  const stateCopyColor = colors.stateCopy ?? colors.body;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title,
        }}
      />

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
        {isLoading ? (
          <View
            style={[
              styles.stateCard,
              {
                backgroundColor: colors.surface,
                borderColor: stateBorderColor,
              },
            ]}
          >
            <Text
              style={[
                styles.stateTitle,
                {
                  color: colors.title,
                },
              ]}
            >
              {loadingTitle}
            </Text>
            <Text
              style={[
                styles.stateCopy,
                {
                  color: stateCopyColor,
                },
              ]}
            >
              {loadingCopy}
            </Text>
          </View>
        ) : null}

        {!isLoading && errorMessage ? (
          <View
            style={[
              styles.stateCard,
              {
                backgroundColor: colors.surface,
                borderColor: stateBorderColor,
              },
            ]}
          >
            <Text
              style={[
                styles.stateTitle,
                {
                  color: colors.title,
                },
              ]}
            >
              {errorTitle}
            </Text>
            <Text
              style={[
                styles.stateCopy,
                {
                  color: stateCopyColor,
                },
              ]}
            >
              {errorMessage}
            </Text>
          </View>
        ) : null}

        {!isLoading && !errorMessage && isReady ? children : null}
      </ScrollView>

      <AdminSavingOverlay
        visible={isSaving}
        title={savingTitle}
        message={savingCopy}
        colors={colors}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  stateCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  stateCopy: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
  },
});
