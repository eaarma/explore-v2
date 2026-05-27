import { isAxiosError } from "axios";

type ApiErrorPayload = {
  message?: string;
  error?: string;
} | string;

export function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  if (isAxiosError<ApiErrorPayload>(error)) {
    const responseData = error.response?.data;

    if (error.response?.status === 404) {
      return "Couldn't find the API endpoint. Check that EXPO_PUBLIC_API_URL points to the backend and includes the /api path.";
    }

    if (typeof responseData === "string" && responseData.trim()) {
      return responseData.trim();
    }

    if (
      responseData &&
      typeof responseData === "object" &&
      typeof responseData.message === "string" &&
      responseData.message.trim()
    ) {
      return responseData.message.trim();
    }

    if (
      responseData &&
      typeof responseData === "object" &&
      typeof responseData.error === "string" &&
      responseData.error.trim()
    ) {
      return responseData.error.trim();
    }

    if (error.code === "ECONNABORTED") {
      return "The request timed out. Check that the API is running and reachable from this device.";
    }

    if (error.message === "Network Error") {
      return "Couldn't reach the API. Check that the backend is running and EXPO_PUBLIC_API_URL points to a reachable host.";
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return fallbackMessage;
}

export function isApiNetworkError(error: unknown) {
  if (!isAxiosError(error)) {
    return false;
  }

  return (
    error.code === "ECONNABORTED" ||
    error.message === "Network Error" ||
    !error.response
  );
}

export function isUnauthorizedApiError(error: unknown) {
  if (!isAxiosError(error)) {
    return false;
  }

  return error.response?.status === 401 || error.response?.status === 403;
}
