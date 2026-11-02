// Agilist for phones. The screens are the same ones as the web demo, bundled inside the
// app and shown full screen in a native WebView, so it runs offline once installed.
// The native side adds what a browser can't: real haptics, the Android back button,
// a splash screen and correct safe areas around the notch and home bar.
// It also does the listening: the WebView cannot recognise speech, so the screens ask this
// side (through expo-speech-recognition) and get "sembang-speech" events back.
import { useCallback, useEffect, useRef, useState } from "react";
import { BackHandler, Platform, StyleSheet, useColorScheme } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import * as SplashScreen from "expo-splash-screen";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import html from "./web/html";

// The speech module is native code. Expo Go does not contain it, so it is loaded defensively:
// without it the app still runs and the screens fall back to typing.
type Speech = typeof import("expo-speech-recognition");
let speech: Speech | null = null;
try { speech = require("expo-speech-recognition") as Speech; } catch { speech = null; }
const Rec = speech?.ExpoSpeechRecognitionModule ?? null;

SplashScreen.preventAutoHideAsync().catch(() => {});

const SURFACE = { light: "#fbfaf6", dark: "#131816" };

type Msg =
  | { type: "haptic"; pattern: number | number[] }
  | { type: "sheet"; open: boolean }
  | { type: "speech"; op: "start" | "stop" | "abort"; lang?: string };

// The page keeps its data (accounts, photos, notes) in localStorage, which needs a real origin.
const BASE_URL = "https://app.agilist.local/";

// iOS does not know the browser-style language ids the screens use.
const IOS_LANG: Record<string, string> = { "en-SG": "en-SG", "cmn-Hans-CN": "zh-CN", "yue-Hant-HK": "zh-HK" };
const speechLang = (lang?: string) => (Platform.OS === "ios" ? IOS_LANG[lang ?? ""] ?? "en-US" : lang ?? "en-SG");

const BEFORE_LOAD = `window.SembangNative = { speech: ${speech ? "true" : "false"}, app: true }; true;`;

export default function App() {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const web = useRef<WebView<object>>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Android back button: close an open bottom sheet first, otherwise behave normally.
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!sheetOpen) return false;
      web.current?.injectJavaScript(
        'window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })); true;',
      );
      return true;
    });
    return () => sub.remove();
  }, [sheetOpen]);

  // Send a speech event into the page.
  const emit = useCallback((detail: Record<string, unknown>) => {
    web.current?.injectJavaScript(
      `window.dispatchEvent(new CustomEvent("sembang-speech", { detail: ${JSON.stringify(detail)} })); true;`,
    );
  }, []);

  useEffect(() => {
    if (!Rec) return;
    const subs = [
      Rec.addListener("result", (ev) => {
        const transcript = ev.results?.[0]?.transcript;
        if (transcript) emit({ kind: "result", transcript, isFinal: !!ev.isFinal });
      }),
      Rec.addListener("error", (ev) => emit({ kind: "error", error: ev.error })),
      Rec.addListener("end", () => emit({ kind: "end" })),
    ];
    return () => { subs.forEach((s) => s.remove()); try { Rec.abort(); } catch { /* not running */ } };
  }, [emit]);

  const startListening = useCallback(async (lang?: string) => {
    if (!Rec) return emit({ kind: "error", error: "service-not-allowed" }), emit({ kind: "end" });
    const perm = await Rec.requestPermissionsAsync();
    if (!perm.granted) return emit({ kind: "error", error: "not-allowed" }), emit({ kind: "end" });
    Rec.start({ lang: speechLang(lang), interimResults: true, continuous: true });
  }, [emit]);

  const onMessage = useCallback((e: WebViewMessageEvent) => {
    let msg: Msg;
    try { msg = JSON.parse(e.nativeEvent.data); } catch { return; }
    if (msg.type === "sheet") setSheetOpen(msg.open);
    if (msg.type === "speech" && Rec) {
      if (msg.op === "start") startListening(msg.lang).catch(() => { emit({ kind: "error", error: "unknown" }); emit({ kind: "end" }); });
      else if (msg.op === "stop") Rec.stop();
      else Rec.abort();
    } else if (msg.type === "speech") {
      emit({ kind: "error", error: "service-not-allowed" });
      emit({ kind: "end" });
    }
    if (msg.type === "haptic") {
      const p = msg.pattern;
      if (Array.isArray(p)) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      else Haptics.impactAsync(p >= 14 ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, [startListening, emit]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.fill, { backgroundColor: SURFACE[scheme] }]} edges={["top", "bottom", "left", "right"]}>
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        <WebView<object>
          ref={web}
          source={{ html, baseUrl: BASE_URL }}
          injectedJavaScriptBeforeContentLoaded={BEFORE_LOAD}
          originWhitelist={["*"]}
          onMessage={onMessage}
          onLoadEnd={() => SplashScreen.hideAsync().catch(() => {})}
          style={[styles.fill, { backgroundColor: SURFACE[scheme] }]}
          javaScriptEnabled
          domStorageEnabled
          bounces={false}
          overScrollMode="never"
          textZoom={100}
          setSupportMultipleWindows={false}
          automaticallyAdjustContentInsets={false}
          contentInsetAdjustmentBehavior="never"
          keyboardDisplayRequiresUserAction={false}
          hideKeyboardAccessoryView={Platform.OS === "ios"}
          allowsLinkPreview={false}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
