import { apiClient } from "@/src/shared/api/apiClient";
import type { AuthUser } from "@/src/features/auth/types/authTypes";

export async function updateCurrentUserName(name: string): Promise<AuthUser> {
  const response = await apiClient.patch<AuthUser>("/users/me", {
    name,
  });

  return response.data;
}

export async function deleteCurrentUserAccount() {
  await apiClient.delete("/users/me");
}
