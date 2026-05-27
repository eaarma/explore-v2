// src/shared/api/apiClient.ts

import { create } from "axios";
import { API_BASE_URL } from "@/src/shared/config/env";
import { getAccessToken } from "@/src/shared/storage/tokenStorage";

export const apiClient = create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
