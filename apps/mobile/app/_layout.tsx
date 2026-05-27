import { useEffect } from "react";
import { ThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";

import { useAppSettingsStore } from "@/src/features/settings/store/appSettingsStore";
import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";

const navigationThemes = {
  light: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: "#0F766E",
      background: "#F8FAFC",
      card: "#FFFFFF",
      text: "#0F172A",
      border: "#E2E8F0",
      notification: "#B91C1C",
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: "#2DD4BF",
      background: "#020617",
      card: "#0F172A",
      text: "#F8FAFC",
      border: "#1E293B",
      notification: "#FCA5A5",
    },
  },
} as const;

export default function RootLayout() {
  const hydrateSettings = useAppSettingsStore((state) => state.hydrate);
  const colorScheme = useColorScheme();

  useEffect(() => {
    void hydrateSettings();
  }, [hydrateSettings]);

  const navigationTheme =
    colorScheme === "dark" ? navigationThemes.dark : navigationThemes.light;
  const headerBackgroundColor =
    colorScheme === "dark" ? "#0F172A" : "#FFFFFF";
  const headerTintColor = colorScheme === "dark" ? "#F8FAFC" : "#0F172A";

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: navigationTheme.colors.background,
          },
          headerStyle: {
            backgroundColor: headerBackgroundColor,
          },
          headerTintColor,
          headerTitleStyle: {
            fontWeight: "700",
          },
        }}
      >
        <Stack.Screen name="startup" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: true,
            title: "Settings",
          }}
        />
        <Stack.Screen
          name="admin"
          options={{
            headerShown: true,
            title: "Admin",
          }}
        />
        <Stack.Screen
          name="admin-locations"
          options={{
            headerShown: true,
            title: "Locations",
          }}
        />
        <Stack.Screen
          name="admin-journeys"
          options={{
            headerShown: true,
            title: "Journeys",
          }}
        />
        <Stack.Screen
          name="admin-journey/[journeyId]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="admin-users"
          options={{
            headerShown: true,
            title: "Users",
          }}
        />
        <Stack.Screen
          name="privacy-policy"
          options={{
            headerShown: true,
            title: "Privacy policy",
          }}
        />
        <Stack.Screen
          name="terms"
          options={{
            headerShown: true,
            title: "Terms",
          }}
        />
        <Stack.Screen
          name="licenses"
          options={{
            headerShown: true,
            title: "Licenses",
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
