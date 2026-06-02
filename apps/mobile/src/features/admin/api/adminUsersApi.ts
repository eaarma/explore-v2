import { AuthUser } from "@/src/features/auth/types/authTypes";
import { apiClient } from "@/src/shared/api/apiClient";

const ADMIN_USERS_BASE_PATH = "/admin/users";

export type AdminUser = AuthUser;
export type UpdateAdminUserRequest = {
  name: string;
  role: string;
  status: string;
};

export async function getAdminUsers(): Promise<AdminUser[]> {
  const response = await apiClient.get<AdminUser[]>(ADMIN_USERS_BASE_PATH);
  return response.data;
}

export async function updateAdminUser(
  id: string,
  payload: UpdateAdminUserRequest,
): Promise<AdminUser> {
  const response = await apiClient.patch<AdminUser>(
    `${ADMIN_USERS_BASE_PATH}/${id}`,
    payload,
  );
  return response.data;
}
