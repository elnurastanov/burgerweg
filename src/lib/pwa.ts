import { Platform } from 'react-native';

import { WEB_BASE } from '@/lib/config';

/** True when the web app runs as an installed PWA (its own window or home-screen app), not in a browser tab. */
export function isInstalledPwa(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  return Boolean(window.matchMedia?.('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone);
}

/** The latest published version (version.json, written by scripts/build-site.mjs), or null if it can't be read. */
export async function fetchLatestVersion(): Promise<string | null> {
  try {
    const res = await fetch(`${WEB_BASE}/version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    const version = (data as { version?: unknown }).version;
    return typeof version === 'string' ? version : null;
  } catch {
    return null;
  }
}

/** Compares "1.2.0"-style versions. */
export function isNewer(latest: string, current: string): boolean {
  const a = latest.split('.').map(Number);
  const b = current.split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0);
  }
  return false;
}

/**
 * Switches to the new version: refresh the service worker (it drops the old caches), then reload. Pages are
 * fetched network-first and bundles are content-hashed, so the reload loads the new release.
 */
export async function applyUpdate() {
  try {
    const registration = await navigator.serviceWorker?.getRegistration(`${WEB_BASE}/`);
    await registration?.update();
  } catch {
    // Reloading alone still loads the new version.
  }
  window.location.reload();
}
