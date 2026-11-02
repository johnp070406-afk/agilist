// Installs Expo and the native modules at versions that match each other.
// `npx expo install` picks the versions the current Expo SDK expects, so the app
// always matches the Expo Go app on your phone.
import { execSync } from "node:child_process";

const run = (cmd) => {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit", shell: true });
};

run("npm install expo@latest");
run("npx expo install react react-native react-native-webview react-native-safe-area-context expo-status-bar expo-haptics expo-splash-screen expo-speech-recognition expo-dev-client");
run("npx expo install typescript @types/react -- --save-dev");
console.log("\nDone. Start the app with:  npx expo start\n");
