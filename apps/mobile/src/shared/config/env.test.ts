import { afterEach, describe, expect, it, jest } from "@jest/globals";

const mutableEnv = process.env as Record<string, string | undefined>;
const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
const ORIGINAL_API_URL = process.env.EXPO_PUBLIC_API_URL;

type EnvModule = typeof import("./env");

function loadApiBaseUrl(options: {
  nodeEnv: string;
  apiUrl?: string;
  platformOS?: "android" | "ios";
  hostUri?: string | null;
}) {
  jest.resetModules();

  mutableEnv.NODE_ENV = options.nodeEnv;

  if (options.apiUrl === undefined) {
    delete mutableEnv.EXPO_PUBLIC_API_URL;
  } else {
    mutableEnv.EXPO_PUBLIC_API_URL = options.apiUrl;
  }

  jest.doMock("expo-constants", () => ({
    __esModule: true,
    default: {
      expoConfig: options.hostUri ? { hostUri: options.hostUri } : undefined,
    },
  }));
  jest.doMock("react-native", () => ({
    Platform: {
      OS: options.platformOS ?? "ios",
    },
  }));

  const module = jest.requireActual("./env") as EnvModule;
  return module.API_BASE_URL;
}

afterEach(() => {
  jest.resetModules();

  if (ORIGINAL_NODE_ENV === undefined) {
    delete mutableEnv.NODE_ENV;
  } else {
    mutableEnv.NODE_ENV = ORIGINAL_NODE_ENV;
  }

  if (ORIGINAL_API_URL === undefined) {
    delete mutableEnv.EXPO_PUBLIC_API_URL;
  } else {
    mutableEnv.EXPO_PUBLIC_API_URL = ORIGINAL_API_URL;
  }
});

describe("API_BASE_URL", () => {
  it("normalizes an explicitly configured API base url", () => {
    expect(
      loadApiBaseUrl({
        nodeEnv: "production",
        apiUrl: " https://api.example.com/ ",
      }),
    ).toBe("https://api.example.com/api");
  });

  it("uses the Expo host URI in development when the API url is not configured", () => {
    expect(
      loadApiBaseUrl({
        nodeEnv: "development",
        hostUri: "192.168.1.42:8081",
      }),
    ).toBe("http://192.168.1.42:8080/api");
  });

  it("throws for non-development builds when the API url is missing", () => {
    expect(() =>
      loadApiBaseUrl({
        nodeEnv: "production",
        platformOS: "android",
      }),
    ).toThrow("EXPO_PUBLIC_API_URL must be set for non-development builds.");
  });
});
