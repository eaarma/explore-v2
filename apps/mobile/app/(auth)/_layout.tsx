import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/src/features/auth/store/authStore";

export default function AuthLayout() {
  const status = useAuthStore((state) => state.status);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (status === "checking") {
    return <Redirect href="/startup" />;
  }

  if (isAuthenticated) {
    return <Redirect href="/map" />;
  }

  return (
    <Stack>
      <Stack.Screen name="login" options={{ title: "Login" }} />
      <Stack.Screen name="register" options={{ title: "Register" }} />
    </Stack>
  );
}
