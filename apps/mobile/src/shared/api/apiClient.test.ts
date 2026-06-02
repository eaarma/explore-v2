import { afterEach, describe, expect, it, jest } from "@jest/globals";

type ApiClientModule = typeof import("./apiClient");

function loadApiClient(accessToken: string | null) {
  jest.resetModules();

  const getAccessToken = jest.fn(async () => accessToken);

  jest.doMock("@/src/shared/config/env", () => ({
    API_BASE_URL: "https://api.example.com/api",
  }));
  jest.doMock("@/src/shared/storage/tokenStorage", () => ({
    getAccessToken,
  }));

  const module = jest.requireActual("./apiClient") as ApiClientModule;
  return {
    apiClient: module.apiClient,
    getAccessToken,
  };
}

function getFirstRequestInterceptor(apiClient: {
  interceptors: {
    request: {
      handlers: (
        | {
            fulfilled?: (config: Record<string, any>) => Promise<Record<string, any>>;
          }
        | null
      )[];
    };
  };
}) {
  const handler = apiClient.interceptors.request.handlers.find(
    (entry) => entry?.fulfilled,
  );

  if (!handler?.fulfilled) {
    throw new Error("Expected the API client to register a request interceptor.");
  }

  return handler.fulfilled;
}

afterEach(() => {
  jest.resetModules();
});

describe("apiClient", () => {
  it("uses the configured API base url and timeout", async () => {
    const { apiClient } = loadApiClient(null);

    expect(apiClient.defaults.baseURL).toBe("https://api.example.com/api");
    expect(apiClient.defaults.timeout).toBe(10000);
  });

  it("adds a bearer token when one is stored", async () => {
    const { apiClient, getAccessToken } = loadApiClient("secret-token");
    const requestInterceptor = getFirstRequestInterceptor(
      apiClient as unknown as Parameters<typeof getFirstRequestInterceptor>[0],
    );

    const config = await requestInterceptor({
      headers: {},
    });

    expect(getAccessToken).toHaveBeenCalledTimes(1);
    expect(config.headers.Authorization).toBe("Bearer secret-token");
  });

  it("leaves the authorization header unset when no token exists", async () => {
    const { apiClient, getAccessToken } = loadApiClient(null);
    const requestInterceptor = getFirstRequestInterceptor(
      apiClient as unknown as Parameters<typeof getFirstRequestInterceptor>[0],
    );

    const config = await requestInterceptor({
      headers: {
        "X-Trace": "trace-id",
      },
    });

    expect(getAccessToken).toHaveBeenCalledTimes(1);
    expect(config.headers.Authorization).toBeUndefined();
    expect(config.headers["X-Trace"]).toBe("trace-id");
  });
});
