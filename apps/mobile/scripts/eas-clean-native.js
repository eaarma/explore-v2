const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const dirsToRemove = [
  "android/.gradle",
  "android/.kotlin",
  "android/build",
  "android/app/build",
  "android/app/.cxx",
];

for (const relativeDir of dirsToRemove) {
  const absoluteDir = path.join(projectRoot, relativeDir);
  try {
    fs.rmSync(absoluteDir, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 100,
    });
  } catch (error) {
    console.warn(`Skipping cleanup for ${relativeDir}: ${error.message}`);
  }
}

console.log("Cleaned generated Android native build directories for EAS.");
