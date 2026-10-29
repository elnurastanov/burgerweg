import { captureTransferFromLink } from '@/lib/transfer';

/**
 * Native only: rewrites incoming links before Expo Router handles them. A transfer link
 * (https://<site>/app/transfer#EBT1.…, opened by Android App Links, e.g. from a scanned QR code) carries the
 * code in its fragment; keep it and show the transfer screen. Every other link passes through unchanged.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    return captureTransferFromLink(path) ? '/transfer' : path;
  } catch {
    return '/';
  }
}
