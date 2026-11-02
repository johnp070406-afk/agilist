# Agilist — phone app

The Agilist demo as a real app on iPhone and Android, built with Expo.

The screens are the same ones as the web demo, bundled inside the app and shown full screen
in a native WebView, so the app works offline once it's open. The native side adds what a
browser can't do:

- **Real haptics** (expo-haptics) when a Hokkien word is recognised, a photo arrives, a note
  is kept, or a question is ticked.
- **Android back button** closes an open bottom sheet before leaving the app.
- **Splash screen and app icon**, light and dark.
- **Safe areas** around the notch, Dynamic Island and home bar.
- **Real speech recognition** (expo-speech-recognition). The screens cannot listen inside a
  WebView, so they ask the phone, which turns speech into text. Audio is never saved. This is
  native code, so it needs a build of the app (`npm run apk`), not Expo Go. In Expo Go the app
  still runs but the microphone is off and the conversation screen asks you to type instead.

## Run it on your phone (no app store)

You need [Node.js](https://nodejs.org) (LTS) on your computer, and the free **Expo Go** app
on your phone (App Store or Google Play).

**Windows:** double-click **`START (Windows).bat`**. The first run installs everything
(about 3–5 minutes).

**Mac or by hand:**

```bash
npm run setup     # first time only
npx expo start
```

A QR code appears. Scan it:

- **iPhone:** open the Camera app and point it at the code. It opens in Expo Go.
- **Android:** open Expo Go and tap **Scan QR code**.

Your phone and computer must be on the same Wi-Fi. On school or public Wi-Fi that blocks
this, use `npx expo start --tunnel` instead.

## An installable Android file (APK)

Built in Expo's cloud, so you don't need Android Studio. Free, about 10–15 minutes.

```bash
npm install -g eas-cli
eas login              # free Expo account
npm run apk            # = eas build --platform android --profile preview
```

When it finishes you get a link. Open it on any Android phone to download and install the
APK. (Android asks to allow installs from this source the first time.)

**iPhone** can't install apps outside the App Store without a paid Apple Developer account
($99/year, then TestFlight). For a demo, Expo Go is the way.

## Changing the screens

The UI lives in the web project next to this one (`../sembang-app`). After changing it:

```bash
cd ../sembang-app && npm run build
cd ../sembang-mobile && node scripts/sync-web.mjs
```

The app reloads on the phone automatically while `npx expo start` is running.

## Files

```
App.tsx            native shell: WebView, haptics, back button, splash, safe areas
web/html.ts        the bundled screens (generated, not in git: run `node scripts/sync-web.mjs` after building the web app)
app.json           name, icon, splash, bundle id
eas.json           cloud build profiles (preview = APK)
scripts/setup.mjs  installs Expo and native modules at matching versions
```
