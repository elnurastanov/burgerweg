import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import type { StateCode } from '@/lib/questions';

const STORAGE_KEY = 'ebt:v1';

export type ThemeMode = 'system' | 'light' | 'dark';

export type Settings = {
  lang: string;
  state: StateCode | null;
  practiceTranslations: boolean;
  theme: ThemeMode;
  /** Questions per day the user aims for; fills the inner ring on the home screen. */
  dailyGoal: number;
  onboarded: boolean;
};

export const DAILY_GOALS = [10, 20, 30, 50] as const;
export const DEFAULT_DAILY_GOAL = 20;

/** Per-question learning state. */
export type QStat = {
  /** Last result: 0 = never answered, 1 = correct, 2 = wrong. */
  r: 0 | 1 | 2;
  /** Learning box, 0–5: raised by correct answers, reset to 1 by wrong ones. */
  b: number;
  /** Times answered correctly / wrongly. */
  c: number;
  w: number;
  star?: boolean;
};

export type ExamRecord = { t: number; score: number; total: number; seconds: number };

export type Progress = {
  stats: Record<string, QStat>;
  exams: ExamRecord[];
  /** Questions answered per local day ("YYYY-MM-DD"), practice and exams. Kept for DAY_HISTORY days. */
  days: Record<string, number>;
  updatedAt: number;
};

/** How many days of answer counts are kept (enough for later charts, small enough for a transfer QR code). */
export const DAY_HISTORY = 90;

/** Local calendar day as "YYYY-MM-DD". */
export function dayKey(date: Date = new Date()) {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

/** Drops days older than `keep` days (keys sort chronologically as strings). */
export function pruneDays(days: Record<string, number>, keep = DAY_HISTORY) {
  const oldest = dayKey(new Date(Date.now() - keep * 86400000));
  return Object.fromEntries(Object.entries(days).filter(([k, n]) => k > oldest && n > 0));
}

function countToday(days: Record<string, number>, n: number) {
  const today = dayKey();
  return pruneDays({ ...days, [today]: (days[today] ?? 0) + n });
}

export type Persisted = { settings: Settings; progress: Progress };

export const EMPTY_STAT: QStat = { r: 0, b: 0, c: 0, w: 0 };

/** Learning state after one more answer: correct answers raise the box, a wrong one resets it to 1. */
function answered(s: QStat, correct: boolean): QStat {
  return {
    ...s,
    r: correct ? 1 : 2,
    c: s.c + (correct ? 1 : 0),
    w: s.w + (correct ? 0 : 1),
    b: correct ? Math.min(5, Math.max(s.b, 1) + 1) : 1,
  };
}

function defaultSettings(): Settings {
  const device = getLocales()[0]?.languageCode ?? 'en';
  return {
    lang: device === 'de' ? 'de' : 'en',
    state: null,
    practiceTranslations: true,
    theme: 'system',
    dailyGoal: DEFAULT_DAILY_GOAL,
    onboarded: false,
  };
}

export const emptyProgress = (): Progress => ({ stats: {}, exams: [], days: {}, updatedAt: 0 });

type AppContext = {
  ready: boolean;
  settings: Settings;
  progress: Progress;
  updateSettings: (patch: Partial<Settings>) => void;
  recordAnswer: (id: string, correct: boolean) => void;
  toggleStar: (id: string) => void;
  addExam: (exam: ExamRecord, answers: { id: string; correct: boolean }[]) => void;
  replaceProgress: (progress: Progress, state?: StateCode | null) => void;
  resetProgress: () => void;
};

const Ctx = createContext<AppContext | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const data = JSON.parse(raw) as Partial<Persisted>;
        if (data.settings) setSettings((s) => ({ ...s, ...data.settings }));
        if (data.progress) setProgress({ ...emptyProgress(), ...data.progress });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  // Debounced persistence; everything lives on the device.
  useEffect(() => {
    if (!ready) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ settings, progress })).catch(() => {});
    }, 300);
  }, [ready, settings, progress]);

  const updateSettings = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), []);

  const patchStat = useCallback((id: string, fn: (s: QStat) => QStat) => {
    setProgress((p) => ({
      ...p,
      stats: { ...p.stats, [id]: fn(p.stats[id] ?? EMPTY_STAT) },
      updatedAt: Date.now(),
    }));
  }, []);

  const recordAnswer = useCallback((id: string, correct: boolean) => {
    setProgress((p) => {
      const s = p.stats[id] ?? EMPTY_STAT;
      return {
        ...p,
        stats: { ...p.stats, [id]: answered(s, correct) },
        days: countToday(p.days, 1),
        updatedAt: Date.now(),
      };
    });
  }, []);

  const toggleStar = useCallback((id: string) => patchStat(id, (s) => ({ ...s, star: !s.star })), [patchStat]);

  const addExam = useCallback((exam: ExamRecord, answers: { id: string; correct: boolean }[]) => {
    setProgress((p) => {
      const stats = { ...p.stats };
      for (const { id, correct } of answers) {
        stats[id] = answered(stats[id] ?? EMPTY_STAT, correct);
      }
      return {
        stats,
        exams: [exam, ...p.exams].slice(0, 50),
        days: countToday(p.days, answers.length),
        updatedAt: Date.now(),
      };
    });
  }, []);

  const replaceProgress = useCallback((next: Progress, state?: StateCode | null) => {
    setProgress({ ...next, days: pruneDays(next.days ?? {}), updatedAt: Date.now() });
    // An imported federal state also completes onboarding (e.g. a fresh device opened via a transfer link).
    if (state) setSettings((s) => ({ ...s, state, onboarded: true }));
  }, []);

  const resetProgress = useCallback(() => setProgress(emptyProgress()), []);

  const value = useMemo(
    () => ({
      ready,
      settings,
      progress,
      updateSettings,
      recordAnswer,
      toggleStar,
      addExam,
      replaceProgress,
      resetProgress,
    }),
    [ready, settings, progress, updateSettings, recordAnswer, toggleStar, addExam, replaceProgress, resetProgress],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
