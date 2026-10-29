import { useCallback } from 'react';

import { useApp } from '@/lib/store';

const en = {
  appName: 'Bürgerweg',
  greeting: 'Welcome back',
  greetingNew: 'Welcome',
  subtitle: 'Calm, steady preparation for your citizenship test (Einbürgerungstest).',

  // onboarding
  chooseLanguage: 'Choose your language',
  chooseLanguageHint: 'You can change this later in settings.',
  chooseState: 'Where do you live?',
  chooseStateHint: 'The test includes 3 questions about your federal state.',
  continue: 'Continue',
  getStarted: 'Get started',

  // home
  progress: 'Your progress',
  mastered: 'mastered',
  answered: 'Answered',
  correct: 'Correct',
  toReview: 'To review',
  examsPassed: 'Exams passed',
  of: 'of',
  readiness: 'Readiness',
  readinessStart: 'Just getting started',
  readinessGrowing: 'Building up',
  readinessGood: 'Looking good',
  readinessReady: 'Exam ready',
  allQuestions: 'All questions',
  allQuestionsSub: '{count} questions · {done} answered',
  examSimulator: 'Exam simulator',
  examSimulatorSub: '33 questions · 60 minutes · in German',
  flashcards: 'Flashcards',
  flashcardsSub: 'Quick reminders · random questions',
  recentExams: 'Recent exams',
  noExamsYet: 'No exams yet. Try one whenever you feel ready.',
  passed: 'Passed',
  failed: 'Not passed',
  transferProgress: 'Transfer progress',
  settings: 'Settings',

  // question list
  search: 'Search questions',
  filterAll: 'All',
  filterGeneral: 'General',
  filterState: 'My state',
  filterWrong: 'Wrong',
  filterStarred: 'Starred',
  filterNew: 'New',
  noResults: 'Nothing here yet.',

  // practice
  question: 'Question',
  next: 'Next',
  previous: 'Previous',
  showTranslation: 'Translation',
  correctAnswer: 'Correct!',
  wrongAnswer: 'Not quite — the correct answer is highlighted.',
  star: 'Star',
  done: 'Done',

  // flashcards & results
  shuffle: 'Shuffle',
  backHome: 'Back to home',
  answer: 'Answer',

  // exam simulator (always rendered in German; English kept for completeness)
  examIntro: 'Just like the real test: 33 questions, 60 minutes. You pass with 17 correct answers.',
  examIntroHint: 'The exam is in German. Use the translation button whenever you need help.',
  examStart: 'Start exam',
  examQuestionOf: 'Question {n} of {total}',
  examSubmit: 'Submit',
  examSubmitConfirm: 'Submit the exam now? {open} questions are still unanswered.',
  examSubmitConfirmAll: 'Submit the exam now?',
  examLeave: 'Leave the exam? Your answers will be lost.',
  examLeaveYes: 'Leave',
  examOverview: 'Overview',

  // exam result (shown in UI language)
  result: 'Result',
  score: '{score} of {total} correct',
  passMark: 'You need at least {mark} correct answers to pass.',
  timeUsed: 'Time used: {time}',
  reviewAnswers: 'Review answers',
  yourAnswer: 'Your answer',
  notAnswered: 'Not answered',
  tryAgain: 'Take another exam',

  // settings
  language: 'Language',
  federalState: 'Federal state',
  practiceTranslations: 'Show translations while practising',
  practiceTranslationsHint: 'The exam simulator always starts in German.',
  appearance: 'Appearance',
  themeSystem: 'System',
  themeLight: 'Light',
  themeDark: 'Dark',
  data: 'Your data',
  resetProgress: 'Reset progress',
  resetConfirm: 'Delete all progress on this device? This cannot be undone.',
  cancel: 'Cancel',
  reset: 'Reset',
  about: 'About',
  appVersion: 'Version {version}',
  aboutText:
    'Questions from the official BAMF catalog "Leben in Deutschland" / Einbürgerungstest (as of {version}). Translations are unofficial and for learning only.',

  // transfer
  transferTitle: 'Transfer progress',
  transferIntro:
    'No account needed. Your progress stays on this device — move it to another phone, tablet or browser with a QR code, a transfer code or a file.',
  sendTitle: 'Send from this device',
  sendHint: 'Scan this QR code with the camera of your other device. It opens Bürgerweg and offers to import your progress.',
  copyCode: 'Copy link',
  copied: 'Copied',
  exportFile: 'Save as file',
  receiveTitle: 'Receive on this device',
  pasteCode: 'Paste a transfer link or code',
  importCode: 'Import',
  importFile: 'Open file',
  importFound: 'Progress found',
  importSummary: '{answered} answered questions, {exams} exams, state: {state}.',
  importMerge: 'Merge with mine',
  importMergeHint: 'Keeps the more practised result for each question.',
  importReplace: 'Replace mine',
  importReplaceHint: 'This device will match the other one exactly.',
  importDone: 'Progress imported',
  importInvalid: 'This doesn’t look like a valid transfer code.',
};

export type StringKey = keyof typeof en;

const de: Record<StringKey, string> = {
  appName: 'Bürgerweg',
  greeting: 'Willkommen zurück',
  greetingNew: 'Willkommen',
  subtitle: 'Ruhig und stetig zum bestandenen Einbürgerungstest.',

  chooseLanguage: 'Wähle deine Sprache',
  chooseLanguageHint: 'Du kannst das später in den Einstellungen ändern.',
  chooseState: 'Wo wohnst du?',
  chooseStateHint: 'Der Test enthält 3 Fragen zu deinem Bundesland.',
  continue: 'Weiter',
  getStarted: 'Los geht’s',

  progress: 'Dein Fortschritt',
  mastered: 'gelernt',
  answered: 'Beantwortet',
  correct: 'Richtig',
  toReview: 'Wiederholen',
  examsPassed: 'Bestandene Tests',
  of: 'von',
  readiness: 'Bereitschaft',
  readinessStart: 'Gerade begonnen',
  readinessGrowing: 'Im Aufbau',
  readinessGood: 'Sieht gut aus',
  readinessReady: 'Bereit für den Test',
  allQuestions: 'Alle Fragen',
  allQuestionsSub: '{count} Fragen · {done} beantwortet',
  examSimulator: 'Testsimulation',
  examSimulatorSub: '33 Fragen · 60 Minuten · auf Deutsch',
  flashcards: 'Lernkarten',
  flashcardsSub: 'Schnell wiederholen · zufällige Fragen',
  recentExams: 'Letzte Tests',
  noExamsYet: 'Noch kein Test. Starte einen, wenn du bereit bist.',
  passed: 'Bestanden',
  failed: 'Nicht bestanden',
  transferProgress: 'Fortschritt übertragen',
  settings: 'Einstellungen',

  search: 'Fragen durchsuchen',
  filterAll: 'Alle',
  filterGeneral: 'Allgemein',
  filterState: 'Bundesland',
  filterWrong: 'Falsch',
  filterStarred: 'Markiert',
  filterNew: 'Neu',
  noResults: 'Hier ist noch nichts.',

  question: 'Frage',
  next: 'Weiter',
  previous: 'Zurück',
  showTranslation: 'Übersetzung',
  correctAnswer: 'Richtig!',
  wrongAnswer: 'Nicht ganz – die richtige Antwort ist markiert.',
  star: 'Markieren',
  done: 'Fertig',

  shuffle: 'Mischen',
  backHome: 'Zur Startseite',
  answer: 'Antwort',

  examIntro: 'Wie im echten Test: 33 Fragen, 60 Minuten. Mit 17 richtigen Antworten hast du bestanden.',
  examIntroHint: 'Der Test ist auf Deutsch. Mit dem Übersetzungs-Knopf bekommst du jederzeit Hilfe.',
  examStart: 'Test starten',
  examQuestionOf: 'Frage {n} von {total}',
  examSubmit: 'Abgeben',
  examSubmitConfirm: 'Test jetzt abgeben? {open} Fragen sind noch unbeantwortet.',
  examSubmitConfirmAll: 'Test jetzt abgeben?',
  examLeave: 'Test verlassen? Deine Antworten gehen verloren.',
  examLeaveYes: 'Verlassen',
  examOverview: 'Übersicht',

  result: 'Ergebnis',
  score: '{score} von {total} richtig',
  passMark: 'Zum Bestehen brauchst du mindestens {mark} richtige Antworten.',
  timeUsed: 'Benötigte Zeit: {time}',
  reviewAnswers: 'Antworten ansehen',
  yourAnswer: 'Deine Antwort',
  notAnswered: 'Nicht beantwortet',
  tryAgain: 'Neuen Test starten',

  language: 'Sprache',
  federalState: 'Bundesland',
  practiceTranslations: 'Übersetzungen beim Üben anzeigen',
  practiceTranslationsHint: 'Die Testsimulation startet immer auf Deutsch.',
  appearance: 'Darstellung',
  themeSystem: 'System',
  themeLight: 'Hell',
  themeDark: 'Dunkel',
  data: 'Deine Daten',
  resetProgress: 'Fortschritt zurücksetzen',
  resetConfirm: 'Gesamten Fortschritt auf diesem Gerät löschen? Das kann nicht rückgängig gemacht werden.',
  cancel: 'Abbrechen',
  reset: 'Zurücksetzen',
  about: 'Über die App',
  appVersion: 'Version {version}',
  aboutText:
    'Fragen aus dem offiziellen BAMF-Gesamtfragenkatalog „Leben in Deutschland“ / Einbürgerungstest (Stand {version}). Übersetzungen sind inoffiziell und dienen nur dem Lernen.',

  transferTitle: 'Fortschritt übertragen',
  transferIntro:
    'Kein Konto nötig. Dein Fortschritt bleibt auf diesem Gerät – übertrage ihn per QR-Code, Transfercode oder Datei auf ein anderes Handy, Tablet oder in einen Browser.',
  sendTitle: 'Von diesem Gerät senden',
  sendHint: 'Scanne diesen QR-Code mit der Kamera deines anderen Geräts. Bürgerweg öffnet sich und bietet die Übernahme an.',
  copyCode: 'Link kopieren',
  copied: 'Kopiert',
  exportFile: 'Als Datei speichern',
  receiveTitle: 'Auf diesem Gerät empfangen',
  pasteCode: 'Transferlink oder -code einfügen',
  importCode: 'Importieren',
  importFile: 'Datei öffnen',
  importFound: 'Fortschritt gefunden',
  importSummary: '{answered} beantwortete Fragen, {exams} Tests, Bundesland: {state}.',
  importMerge: 'Mit meinem zusammenführen',
  importMergeHint: 'Behält pro Frage das besser geübte Ergebnis.',
  importReplace: 'Meinen ersetzen',
  importReplaceHint: 'Dieses Gerät übernimmt den Stand des anderen Geräts.',
  importDone: 'Fortschritt übernommen',
  importInvalid: 'Das sieht nicht nach einem gültigen Transfercode aus.',
};

const dictionaries: Record<string, Record<StringKey, string>> = { en, de };

/** UI languages. Add a dictionary above (and a question translation file) to add one. */
export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
] as const;

export type Lang = (typeof LANGUAGES)[number]['code'];

export function translate(lang: string, key: StringKey, params?: Record<string, string | number>) {
  let s = (dictionaries[lang] ?? en)[key] ?? en[key];
  if (params) for (const [k, v] of Object.entries(params)) s = s.replace(`{${k}}`, String(v));
  return s;
}

/** Translator for the user's chosen UI language. */
export function useT() {
  const { settings } = useApp();
  return useCallback(
    (key: StringKey, params?: Record<string, string | number>) => translate(settings.lang, key, params),
    [settings.lang],
  );
}
