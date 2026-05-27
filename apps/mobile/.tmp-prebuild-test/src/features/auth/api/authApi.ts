// src/features/auth/api/authApi.ts

import { apiClient } from "@/src/shared/api/apiClient";
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  AuthUser,
} from "@/src/features/auth/types/authTypes";

export async function loginUser(payload: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/login", payload);
  return response.data;
}

export async function registerUser(
  payload: RegisterRequest,
): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>(
    "/auth/register",
    payload,
  );
  return response.data;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiClient.get<AuthUser>("/auth/me");
  return response.data;
}
