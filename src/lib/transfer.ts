/**
 * Account-free progress transfer.
 *
 * Progress is packed into a compact string so it fits into a single QR code:
 * every question takes 3 base-36 chars (status/box/star, correct count, wrong count)
 * in catalog order, then the payload is deflated and base64url-encoded.
 */
import { deflateSync, inflateSync, strFromU8, strToU8 } from 'fflate';

import { CATALOG_VERSION, QUESTIONS, type StateCode } from '@/lib/questions';
import { EMPTY_STAT, type ExamRecord, type Progress, type QStat } from '@/lib/store';

const PREFIX = 'EBT1.';

type Payload = {
  v: 1;
  cat: string;
  st: StateCode | null;
  q: string;
  /** Exams as [minutes since epoch, score, total, seconds]. */
  e: [number, number, number, number][];
  u: number;
};

const b36 = (n: number) => Math.max(0, Math.min(35, n)).toString(36);

function packStats(stats: Record<string, QStat>) {
  return QUESTIONS.map((q) => {
    const s = stats[q.id] ?? EMPTY_STAT;
    return b36(s.r * 12 + Math.min(5, s.b) * 2 + (s.star ? 1 : 0)) + b36(s.c) + b36(s.w);
  }).join('');
}

function unpackStats(packed: string) {
  const stats: Record<string, QStat> = {};
  QUESTIONS.forEach((q, i) => {
    const chunk = packed.slice(i * 3, i * 3 + 3);
    if (chunk.length < 3 || chunk === '000') return;
    const head = parseInt(chunk[0], 36);
    stats[q.id] = {
      r: Math.floor(head / 12) as 0 | 1 | 2,
      b: Math.floor((head % 12) / 2),
      star: head % 2 === 1 || undefined,
      c: parseInt(chunk[1], 36),
      w: parseInt(chunk[2], 36),
    };
  });
  return stats;
}

function toBase64Url(bytes: Uint8Array) {
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string) {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function encodeTransfer(progress: Progress, state: StateCode | null): string {
  const payload: Payload = {
    v: 1,
    cat: CATALOG_VERSION,
    st: state,
    q: packStats(progress.stats),
    e: progress.exams.slice(0, 20).map((x) => [Math.round(x.t / 60000), x.score, x.total, x.seconds]),
    u: progress.updatedAt,
  };
  return PREFIX + toBase64Url(deflateSync(strToU8(JSON.stringify(payload)), { level: 9 }));
}

export type Decoded = { progress: Progress; state: StateCode | null };

export function decodeTransfer(code: string): Decoded | null {
  try {
    const trimmed = code.trim();
    const start = trimmed.indexOf(PREFIX);
    if (start < 0) return null;
    const body = trimmed.slice(start + PREFIX.length).split(/\s/)[0];
    const payload = JSON.parse(strFromU8(inflateSync(fromBase64Url(body)))) as Payload;
    if (payload.v !== 1 || typeof payload.q !== 'string') return null;
    const exams: ExamRecord[] = payload.e.map(([m, score, total, seconds]) => ({ t: m * 60000, score, total, seconds }));
    return { progress: { stats: unpackStats(payload.q), exams, updatedAt: payload.u }, state: payload.st };
  } catch {
    return null;
  }
}

// A transfer link (…/transfer#EBT1.…) opened in the browser. Captured once at app start, before the router
// initializes (it re-renders screens and rewrites the URL during startup), and kept until the user decides.
let pendingFromUrl: Decoded | 'invalid' | null = null;

/** Web: read a transfer code from the URL fragment and remove it from the address bar. Call once at startup. */
export function captureTransferFromUrl() {
  if (typeof window === 'undefined' || typeof window.location?.hash !== 'string') return;
  const hash = window.location.hash;
  if (!hash.includes(PREFIX)) return;
  pendingFromUrl = decodeTransfer(hash) ?? 'invalid';
  window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
}

export const peekTransferFromUrl = () => pendingFromUrl;

/** Forget the captured link and remove the code from the address bar (the router may have restored it). */
export function clearTransferFromUrl() {
  pendingFromUrl = null;
  if (typeof window !== 'undefined' && window.location?.hash.includes(PREFIX)) {
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
  }
}

const attempts = (s: QStat) => s.c + s.w;

/** Merges incoming progress into local: per question keep the more practised record. */
export function mergeProgress(local: Progress, incoming: Progress): Progress {
  const stats: Record<string, QStat> = { ...local.stats };
  for (const [id, inc] of Object.entries(incoming.stats)) {
    const cur = stats[id];
    if (!cur) {
      stats[id] = inc;
      continue;
    }
    const winner = attempts(inc) > attempts(cur) || (attempts(inc) === attempts(cur) && inc.b > cur.b) ? inc : cur;
    stats[id] = { ...winner, star: cur.star || inc.star || undefined };
  }
  const seen = new Set<number>();
  const exams = [...local.exams, ...incoming.exams]
    .filter((e) => {
      const key = Math.round(e.t / 60000);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.t - a.t)
    .slice(0, 50);
  return { stats, exams, updatedAt: Date.now() };
}
