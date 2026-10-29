import { Platform } from 'react-native';

/** Path the web app is served under. Must match `experiments.baseUrl` in app.json and the PWA manifest scope. */
export const WEB_BASE = '/app';

/**
 * Public URL of the hosted web app, e.g. "https://example.org/app" (no trailing slash).
 * Set EXPO_PUBLIC_WEB_APP_URL at build time; on web it falls back to the current address.
 * Used to turn transfer codes into links that any phone camera can open.
 */
export function webAppUrl(): string | null {
  const configured = process.env.EXPO_PUBLIC_WEB_APP_URL;
  if (configured) return configured.replace(/\/+$/, '');
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // Everything before the current route, e.g. https://host/app/transfer → https://host/app
    return window.location.href.split('#')[0].replace(/\/transfer\/?$/, '').replace(/\/+$/, '');
  }
  return null;
}

/** Link that opens the transfer screen and imports `code` from the URL fragment (never sent to a server). */
export function transferLink(code: string): string {
  const base = webAppUrl();
  return base ? `${base}/transfer#${code}` : code;
}
