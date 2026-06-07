const { expo } = require("./app.json");

const RELEASE_BUILD_PROFILES = new Set(["internal-production", "production"]);

function validateReleaseBuildEnv() {
  const buildProfile = process.env.EAS_BUILD_PROFILE?.trim() ?? "";
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim() ?? "";
  const mapTilerApiKey =
    process.env.EXPO_PUBLIC_MAPTILER_API_KEY?.trim() ?? "";

  if (!RELEASE_BUILD_PROFILES.has(buildProfile)) {
    return;
  }

  if (apiUrl.length === 0) {
    throw new Error(
      "EXPO_PUBLIC_API_URL must be set for the internal-production and production EAS profiles.",
    );
  }

  if (!apiUrl.startsWith("https://")) {
    throw new Error(
      "EXPO_PUBLIC_API_URL must use https:// for the internal-production and production EAS profiles.",
    );
  }

  if (mapTilerApiKey.length === 0) {
    throw new Error(
      "EXPO_PUBLIC_MAPTILER_API_KEY must be set for the internal-production and production EAS profiles.",
    );
  }
}

validateReleaseBuildEnv();

module.exports = {
  ...expo,
  android: {
    ...expo.android,
    usesCleartextTraffic: false,
  },
};
