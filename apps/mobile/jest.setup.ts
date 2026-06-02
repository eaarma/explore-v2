import { jest } from "@jest/globals";

jest.mock("expo-secure-store", () => ({
  __esModule: true,
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: {
      hostUri: null,
    },
  },
}));
