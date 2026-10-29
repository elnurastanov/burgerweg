import base from '@/data/questions.de.json';
import en from '@/data/translations/en.json';

export type StateCode =
  | 'BW' | 'BY' | 'BE' | 'BB' | 'HB' | 'HH' | 'HE' | 'MV'
  | 'NI' | 'NW' | 'RP' | 'SL' | 'SN' | 'ST' | 'SH' | 'TH';

export type Question = {
  id: string;
  /** Number within its section (1–300 general, 1–10 per state). */
  n: number;
  /** Federal state for state-specific questions, null for general ones. */
  s: StateCode | null;
  q: string;
  o: string[];
  /** Index of the correct option. */
  a: number;
  img?: string;
};

export type Translation = { q: string; o: string[] };

/** Version of the official BAMF catalog the data was built from. */
export const CATALOG_VERSION = '2025-05-07';

export const QUESTIONS = base as Question[];
export const QUESTION_INDEX = new Map(QUESTIONS.map((q, i) => [q.id, i]));
const byId = new Map(QUESTIONS.map((q) => [q.id, q]));

export const getQuestion = (id: string) => byId.get(id);

// Question translations per UI language. German is the source, so it has none.
const translations: Record<string, Record<string, Translation>> = { en };

export function getTranslation(lang: string, id: string): Translation | undefined {
  return translations[lang]?.[id];
}

/** Language German content is translated into: the UI language, or English when the UI itself is German. */
export const translationLang = (uiLang: string) => (uiLang !== 'de' && uiLang in translations ? uiLang : 'en');

export const STATES: { code: StateCode; de: string; en: string }[] = [
  { code: 'BW', de: 'Baden-Württemberg', en: 'Baden-Württemberg' },
  { code: 'BY', de: 'Bayern', en: 'Bavaria' },
  { code: 'BE', de: 'Berlin', en: 'Berlin' },
  { code: 'BB', de: 'Brandenburg', en: 'Brandenburg' },
  { code: 'HB', de: 'Bremen', en: 'Bremen' },
  { code: 'HH', de: 'Hamburg', en: 'Hamburg' },
  { code: 'HE', de: 'Hessen', en: 'Hesse' },
  { code: 'MV', de: 'Mecklenburg-Vorpommern', en: 'Mecklenburg-Western Pomerania' },
  { code: 'NI', de: 'Niedersachsen', en: 'Lower Saxony' },
  { code: 'NW', de: 'Nordrhein-Westfalen', en: 'North Rhine-Westphalia' },
  { code: 'RP', de: 'Rheinland-Pfalz', en: 'Rhineland-Palatinate' },
  { code: 'SL', de: 'Saarland', en: 'Saarland' },
  { code: 'SN', de: 'Sachsen', en: 'Saxony' },
  { code: 'ST', de: 'Sachsen-Anhalt', en: 'Saxony-Anhalt' },
  { code: 'SH', de: 'Schleswig-Holstein', en: 'Schleswig-Holstein' },
  { code: 'TH', de: 'Thüringen', en: 'Thuringia' },
];

export function stateName(code: StateCode | null, lang: string) {
  const s = STATES.find((x) => x.code === code);
  if (!s) return '';
  return lang === 'de' ? s.de : s.en;
}

/** The questions relevant for a user: the 300 general ones plus the 10 for their state. */
export function questionsFor(state: StateCode | null) {
  return QUESTIONS.filter((q) => q.s === null || q.s === state);
}

/** Short human label, e.g. "#42" or "BE 3". */
export const questionLabel = (q: Question) => (q.s ? `${q.s} ${q.n}` : `#${q.n}`);

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const EXAM = { general: 30, state: 3, minutes: 60, passMark: 17 };

/** Draws a real-exam style set: 30 random general + 3 random state questions. */
export function drawExam(state: StateCode): string[] {
  const general = shuffle(QUESTIONS.filter((q) => q.s === null)).slice(0, EXAM.general);
  const local = shuffle(QUESTIONS.filter((q) => q.s === state)).slice(0, EXAM.state);
  return shuffle([...general, ...local]).map((q) => q.id);
}
