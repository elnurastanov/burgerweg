import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import Head from 'expo-router/head';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { DialogProvider } from '@/components/dialog';
import { WEB_BASE } from '@/lib/config';
import { AppProvider, useApp } from '@/lib/store';
import { captureTransferFromUrl } from '@/lib/transfer';
import { useTheme } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

// Transfer links (…/app/transfer#EBT1.…): read the code before the router starts rewriting the URL.
if (Platform.OS === 'web') captureTransferFromUrl();

// PWA: cache the app for offline use (production web builds only; dev bundles must not be cached).
if (Platform.OS === 'web' && !__DEV__ && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  const register = () => navigator.serviceWorker.register(`${WEB_BASE}/sw.js`, { scope: `${WEB_BASE}/` }).catch(() => {});
  // This module may load after the page's load event (lazy route bundles), so don't rely on it alone.
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register);
}

function Root() {
  const { ready } = useApp();
  const { c, dark } = useTheme();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  const base = dark ? DarkTheme : DefaultTheme;
  return (
    <ThemeProvider
      value={{ ...base, colors: { ...base.colors, background: c.bg, card: c.bg, text: c.text, primary: c.primary, border: c.border } }}>
      <DialogProvider>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg }, animation: 'fade_from_bottom' }}>
          <Stack.Screen name="exam/run" options={{ gestureEnabled: false }} />
        </Stack>
      </DialogProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      {/* Web only: tab title and browser theme color (the favicon comes from app.json). On iOS, expo-router's Head
          drives Handoff and throws without a configured web origin, so it must not render on native. */}
      {Platform.OS === 'web' ? (
        <Head>
          <title>Bürgerweg – Einbürgerungstest</title>
          <meta name="description" content="Calm preparation for the German citizenship test (Einbürgerungstest / Leben in Deutschland)." />
          <meta name="theme-color" content="#4A4544" />
          <link rel="manifest" href={`${WEB_BASE}/manifest.webmanifest`} />
          <link rel="icon" href={`${WEB_BASE}/favicon.ico`} />
          <link rel="apple-touch-icon" href={`${WEB_BASE}/icons/apple-touch-icon.png`} />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-title" content="Bürgerweg" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        </Head>
      ) : null}
      <Root />
    </AppProvider>
  );
}
