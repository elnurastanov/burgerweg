import base from '@/data/questions.de.json';
import az from '@/data/translations/az.json';
import en from '@/data/translations/en.json';
import ru from '@/data/translations/ru.json';
import tr from '@/data/translations/tr.json';

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
const byId = new Map(QUESTIONS.map((q) => [q.id, q]));

export const getQuestion = (id: string) => byId.get(id);

// Question translations per UI language. German is the source, so it has none.
const translations: Record<string, Record<string, Translation>> = { en, az, tr, ru };

export function getTranslation(lang: string, id: string): Translation | undefined {
  return translations[lang]?.[id];
}

/** Language German content is translated into: the UI language, or English when the UI itself is German. */
export const translationLang = (uiLang: string) => (uiLang !== 'de' && uiLang in translations ? uiLang : 'en');

/** State names per UI language; a translated name carries the German one in brackets where they differ. */
export const STATES: { code: StateCode; de: string; en: string; az: string; tr: string; ru: string }[] = [
  { code: 'BW', de: 'Baden-Württemberg', en: 'Baden-Württemberg', az: 'Baden-Vürtemberq (Baden-Württemberg)', tr: 'Baden-Württemberg', ru: 'Баден-Вюртемберг (Baden-Württemberg)' },
  { code: 'BY', de: 'Bayern', en: 'Bavaria', az: 'Bavariya (Bayern)', tr: 'Bavyera (Bayern)', ru: 'Бавария (Bayern)' },
  { code: 'BE', de: 'Berlin', en: 'Berlin', az: 'Berlin', tr: 'Berlin', ru: 'Берлин (Berlin)' },
  { code: 'BB', de: 'Brandenburg', en: 'Brandenburg', az: 'Brandenburq (Brandenburg)', tr: 'Brandenburg', ru: 'Бранденбург (Brandenburg)' },
  { code: 'HB', de: 'Bremen', en: 'Bremen', az: 'Bremen', tr: 'Bremen', ru: 'Бремен (Bremen)' },
  { code: 'HH', de: 'Hamburg', en: 'Hamburg', az: 'Hamburq (Hamburg)', tr: 'Hamburg', ru: 'Гамбург (Hamburg)' },
  { code: 'HE', de: 'Hessen', en: 'Hesse', az: 'Hessen', tr: 'Hessen', ru: 'Гессен (Hessen)' },
  { code: 'MV', de: 'Mecklenburg-Vorpommern', en: 'Mecklenburg-Western Pomerania', az: 'Meklenburq-Ön Pomeraniya (Mecklenburg-Vorpommern)', tr: 'Mecklenburg-Ön Pomeranya (Mecklenburg-Vorpommern)', ru: 'Мекленбург-Передняя Померания (Mecklenburg-Vorpommern)' },
  { code: 'NI', de: 'Niedersachsen', en: 'Lower Saxony', az: 'Aşağı Saksoniya (Niedersachsen)', tr: 'Aşağı Saksonya (Niedersachsen)', ru: 'Нижняя Саксония (Niedersachsen)' },
  { code: 'NW', de: 'Nordrhein-Westfalen', en: 'North Rhine-Westphalia', az: 'Şimali Reyn-Vestfaliya (Nordrhein-Westfalen)', tr: 'Kuzey Ren-Vestfalya (Nordrhein-Westfalen)', ru: 'Северный Рейн-Вестфалия (Nordrhein-Westfalen)' },
  { code: 'RP', de: 'Rheinland-Pfalz', en: 'Rhineland-Palatinate', az: 'Reynland-Pfals (Rheinland-Pfalz)', tr: 'Renanya-Palatina (Rheinland-Pfalz)', ru: 'Рейнланд-Пфальц (Rheinland-Pfalz)' },
  { code: 'SL', de: 'Saarland', en: 'Saarland', az: 'Saarland', tr: 'Saarland', ru: 'Саар (Saarland)' },
  { code: 'SN', de: 'Sachsen', en: 'Saxony', az: 'Saksoniya (Sachsen)', tr: 'Saksonya (Sachsen)', ru: 'Саксония (Sachsen)' },
  { code: 'ST', de: 'Sachsen-Anhalt', en: 'Saxony-Anhalt', az: 'Saksoniya-Anhalt (Sachsen-Anhalt)', tr: 'Saksonya-Anhalt (Sachsen-Anhalt)', ru: 'Саксония-Анхальт (Sachsen-Anhalt)' },
  { code: 'SH', de: 'Schleswig-Holstein', en: 'Schleswig-Holstein', az: 'Şlezviq-Holşteyn (Schleswig-Holstein)', tr: 'Schleswig-Holstein', ru: 'Шлезвиг-Гольштейн (Schleswig-Holstein)' },
  { code: 'TH', de: 'Thüringen', en: 'Thuringia', az: 'Türingiya (Thüringen)', tr: 'Thüringen', ru: 'Тюрингия (Thüringen)' },
];

export function stateName(code: StateCode | null, lang: string) {
  const s = STATES.find((x) => x.code === code);
  if (!s) return '';
  return (s as Record<string, string>)[lang] ?? s.en;
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
