const { expo } = require("./app.json");

function validateProductionApiUrl() {
  const buildProfile = process.env.EAS_BUILD_PROFILE?.trim() ?? "";
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim() ?? "";

  if (buildProfile !== "production") {
    return;
  }

  if (apiUrl.length === 0) {
    throw new Error(
      "EXPO_PUBLIC_API_URL must be set for the production EAS profile.",
    );
  }

  if (!apiUrl.startsWith("https://")) {
    throw new Error(
      "EXPO_PUBLIC_API_URL must use https:// for the production EAS profile.",
    );
  }
}

validateProductionApiUrl();

module.exports = {
  ...expo,
  android: {
    ...expo.android,
    usesCleartextTraffic: false,
  },
};
