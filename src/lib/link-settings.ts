import Constants from 'expo-constants';
import { ActivityAction, startActivityAsync } from 'expo-intent-launcher';
import { Linking, Platform } from 'react-native';

import { webAppUrl } from '@/lib/config';

/** Host that transfer links use, e.g. "astanov.com". Android lists it under the app's "Open by default" settings. */
export function linkHost(): string | null {
  const url = webAppUrl();
  return url ? new URL(url).host : null;
}

/** Only the Android app can be set to open links, and only if the build declares a link host (see app.config.js). */
export function canOpenLinksInApp(): boolean {
  return Platform.OS === 'android' && linkHost() !== null;
}

/**
 * Opens the system screen where the user allows this app to open transfer links.
 * Android doesn't let an app turn this on itself: unverified links stay off until the user allows them.
 */
export async function openLinkSettings(): Promise<void> {
  // The dedicated "Open by default" screen exists from Android 12 (API 31); before that it's part of App info.
  const action = Number(Platform.Version) >= 31 ? ActivityAction.APP_OPEN_BY_DEFAULT_SETTINGS : ActivityAction.APPLICATION_DETAILS_SETTINGS;
  try {
    await startActivityAsync(action, { data: `package:${Constants.expoConfig?.android?.package}` });
  } catch {
    await Linking.openSettings();
  }
}
