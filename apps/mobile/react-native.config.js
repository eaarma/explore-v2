const path = require("path");

function resolvePackageRoot(packageName) {
  return path.dirname(require.resolve(`${packageName}/package.json`));
}

function androidDependencyOverride(packageName) {
  const root = resolvePackageRoot(packageName);

  return {
    root,
    platforms: {
      android: {
        sourceDir: path.join(root, "android"),
      },
    },
  };
}

// These overrides keep Android sourceDir resolution explicit for EAS/Linux builds.
module.exports = {
  dependencies: {
    "@maplibre/maplibre-react-native": androidDependencyOverride(
      "@maplibre/maplibre-react-native"
    ),
    "react-native-gesture-handler": androidDependencyOverride(
      "react-native-gesture-handler"
    ),
    "react-native-reanimated": androidDependencyOverride(
      "react-native-reanimated"
    ),
    "react-native-safe-area-context": androidDependencyOverride(
      "react-native-safe-area-context"
    ),
    "react-native-screens": androidDependencyOverride("react-native-screens"),
    "react-native-worklets": androidDependencyOverride(
      "react-native-worklets"
    ),
  },
};
