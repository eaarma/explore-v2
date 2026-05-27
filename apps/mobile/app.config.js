const { expo } = require("./app.json");

const allowAndroidCleartext =
  process.env.EXPO_ANDROID_ALLOW_CLEARTEXT === "1";

module.exports = {
  ...expo,
  android: {
    ...expo.android,
    usesCleartextTraffic: allowAndroidCleartext,
  },
};
