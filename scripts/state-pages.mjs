/**
 * One landing page per federal state and language, for searches like "Einbürgerungstest Bayern" or
 * "Einbürgerungstest Berlin English". Written into the copied landing folder before the build fills in
 * {{SITE_URL}} / {{REPO_URL}} / {{YEAR}} and moves root-relative links under BASE, like the hand-written pages.
 *
 *   /einbuergerungstest-<slug>/      German
 *   /en/einbuergerungstest-<slug>/   English (same German slug: people search the German word in English too)
 *
 * The pages describe the test in that state and link into the app. They don't list the catalog questions.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Facts the state questions ask about. Kept to what is stable: capital, parliament, head of government's title.
export const STATES = [
  { code: 'BW', de: 'Baden-Württemberg', en: 'Baden-Württemberg', capital: ['Stuttgart', 'Stuttgart'] },
  { code: 'BY', de: 'Bayern', en: 'Bavaria', capital: ['München', 'Munich (München)'] },
  { code: 'BE', de: 'Berlin', en: 'Berlin', capital: null, parliament: 'abgeordnetenhaus', head: 'governing' },
  { code: 'BB', de: 'Brandenburg', en: 'Brandenburg', capital: ['Potsdam', 'Potsdam'] },
  { code: 'HB', de: 'Bremen', en: 'Bremen', capital: null, parliament: 'buergerschaftHB', head: 'senate' },
  { code: 'HH', de: 'Hamburg', en: 'Hamburg', capital: null, parliament: 'buergerschaftHH', head: 'first' },
  { code: 'HE', de: 'Hessen', en: 'Hesse', capital: ['Wiesbaden', 'Wiesbaden'] },
  { code: 'MV', de: 'Mecklenburg-Vorpommern', en: 'Mecklenburg-Western Pomerania', capital: ['Schwerin', 'Schwerin'] },
  { code: 'NI', de: 'Niedersachsen', en: 'Lower Saxony', capital: ['Hannover', 'Hanover (Hannover)'] },
  { code: 'NW', de: 'Nordrhein-Westfalen', en: 'North Rhine-Westphalia', capital: ['Düsseldorf', 'Düsseldorf'], short: 'NRW' },
  { code: 'RP', de: 'Rheinland-Pfalz', en: 'Rhineland-Palatinate', capital: ['Mainz', 'Mainz'] },
  { code: 'SL', de: 'Saarland', en: 'Saarland', capital: ['Saarbrücken', 'Saarbrücken'] },
  { code: 'SN', de: 'Sachsen', en: 'Saxony', capital: ['Dresden', 'Dresden'] },
  { code: 'ST', de: 'Sachsen-Anhalt', en: 'Saxony-Anhalt', capital: ['Magdeburg', 'Magdeburg'] },
  { code: 'SH', de: 'Schleswig-Holstein', en: 'Schleswig-Holstein', capital: ['Kiel', 'Kiel'] },
  { code: 'TH', de: 'Thüringen', en: 'Thuringia', capital: ['Erfurt', 'Erfurt'] },
].map((s) => ({ ...s, slug: slugify(s.de) }));

const PARLIAMENT = {
  landtag: ['Landtag', 'state parliament (Landtag)'],
  abgeordnetenhaus: ['Abgeordnetenhaus', 'House of Representatives (Abgeordnetenhaus)'],
  buergerschaftHB: ['Bremische Bürgerschaft', 'Bremen state parliament (Bürgerschaft)'],
  buergerschaftHH: ['Hamburgische Bürgerschaft', 'Hamburg state parliament (Bürgerschaft)'],
};
const HEAD = {
  mp: ['Ministerpräsidentin oder Ministerpräsident', 'Minister-President (Ministerpräsident)'],
  governing: ['Regierende Bürgermeisterin oder Regierender Bürgermeister', 'Governing Mayor (Regierender Bürgermeister)'],
  senate: ['Präsidentin oder Präsident des Senats', 'President of the Senate (Präsident des Senats)'],
  first: ['Erste Bürgermeisterin oder Erster Bürgermeister', 'First Mayor (Erster Bürgermeister)'],
};

export function slugify(name) {
  return (
    'einbuergerungstest-' +
    name
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  );
}

/** Paths (without SITE_URL) of every state page, as [de, en] pairs, for the sitemap. */
export const statePaths = () => STATES.map((s) => [`/${s.slug}/`, `/en/${s.slug}/`]);

/** Writes all state pages into `dir` (the copied landing folder). */
export function writeStatePages(dir) {
  for (const s of STATES) {
    for (const lang of ['de', 'en']) {
      const folder = join(dir, lang === 'de' ? '' : 'en', s.slug);
      mkdirSync(folder, { recursive: true });
      writeFileSync(join(folder, 'index.html'), page(s, lang));
    }
  }
}

/** The first text that fits what search results show (60 characters for titles, 160 for descriptions). */
const fit = (texts, max = 60) => texts.find((x) => x.length <= max) ?? texts.at(-1);

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function facts(s, lang) {
  const i = lang === 'de' ? 0 : 1;
  const parliament = PARLIAMENT[s.parliament ?? 'landtag'][i];
  const head = HEAD[s.head ?? 'mp'][i];
  if (lang === 'de') {
    return [
      s.capital ? `Landeshauptstadt: ${s.capital[0]}` : `${s.de} ist ein Stadtstaat: Stadt und Land zugleich`,
      `Landesparlament: ${parliament}`,
      `Regierungschef: ${head}`,
    ];
  }
  return [
    s.capital ? `State capital: ${s.capital[1]}` : `${s.en} is a city-state: a city and a federal state at once`,
    `State parliament: ${parliament}`,
    `Head of government: ${head}`,
  ];
}

function page(s, lang) {
  const de = lang === 'de';
  const name = de ? s.de : s.en;
  const self = de ? `/${s.slug}/` : `/en/${s.slug}/`;
  const other = de ? `/en/${s.slug}/` : `/${s.slug}/`;
  const home = de ? '/' : '/en/';
  const searchName = s.short ? `${s.de} (${s.short})` : s.de;

  const t = de
    ? {
        title: fit([`Einbürgerungstest ${s.short ?? s.de}: Fragen online üben | Bürgerweg`, `Einbürgerungstest ${s.short ?? s.de} üben | Bürgerweg`, `Einbürgerungstest ${s.de} | Bürgerweg`]),
        description: fit(
          [
            `Einbürgerungstest ${s.de} kostenlos online üben: 300 allgemeine und 10 Fragen für ${s.de}, Testsimulation mit 33 Fragen, Lernkarten. Ohne Konto, offline.`,
            `Einbürgerungstest ${s.de} kostenlos online üben: 310 Fragen inkl. 10 für ${s.de}, Testsimulation, Lernkarten. Ohne Konto.`,
            `Einbürgerungstest ${s.de} kostenlos üben: 310 Fragen, Testsimulation, Lernkarten. Ohne Konto, offline.`,
          ],
          160,
        ),
        eyebrow: `Einbürgerungstest &amp; Leben in Deutschland · ${esc(s.de)}`,
        h1: `Einbürgerungstest ${esc(searchName)} – kostenlos online üben`,
        lead: `Wer in ${esc(s.de)} wohnt, bekommt im Test 3 Fragen zu ${esc(s.de)}. Bürgerweg zeigt dir genau die 310 Fragen, die für dich zählen: 300 allgemeine und die 10 Fragen für ${esc(s.de)}, mit Testsimulation und Übersetzung.`,
        cta: `Fragen für ${esc(s.de)} üben`,
        factsTitle: 'Der Test in Zahlen',
        f: ['Fragen im Test', 'Minuten Zeit', 'richtige zum Bestehen', `Fragen für ${esc(s.de)} zum Üben`],
        aboutTitle: `Was im Test für ${esc(s.de)} drankommt`,
        aboutLead: `Der Test ist in ganz Deutschland gleich aufgebaut. Nur 3 der 33 Fragen hängen vom Bundesland ab.`,
        about: [
          `<strong>30 allgemeine Fragen</strong> aus dem Katalog mit 300 Fragen: Politik und Demokratie, Geschichte, Gesellschaft und Zusammenleben.`,
          `<strong>3 Fragen zu ${esc(s.de)}</strong> aus 10 Fragen für dein Bundesland, zum Beispiel zu Wappen und Landesflagge, Landeshauptstadt, Landtag, Wahlen und Regierung.`,
          `Du hast <strong>60 Minuten</strong>. Mit <strong>17 richtigen Antworten</strong> hast du den Einbürgerungstest bestanden.`,
        ],
        knowTitle: `Gut zu wissen über ${esc(s.de)}`,
        stepsTitle: `So übst du für ${esc(s.de)}`,
        steps: [
          ['Bundesland wählen', `Öffne Bürgerweg und wähle ${esc(s.de)}. Die App zeigt dir dann die 300 allgemeinen und die 10 Fragen für ${esc(s.de)}.`],
          ['Täglich ein paar Fragen', 'Setz dir ein Tagesziel, z. B. 20 Fragen. Der innere Ring zeigt, wie viel du heute geschafft hast.'],
          ['Testsimulation', '33 Fragen in 60 Minuten, wie am Prüfungstag, auf Deutsch mit Übersetzung auf Knopfdruck.'],
        ],
        faqTitle: 'Häufige Fragen',
        faq: [
          [`Wie viele Fragen hat der Einbürgerungstest in ${s.de}?`, `33 Fragen: 30 aus dem allgemeinen Katalog mit 300 Fragen und 3 aus den 10 Fragen für ${s.de}. Du lernst also 310 Fragen.`],
          ['Wie viele Fragen muss ich richtig beantworten?', 'Mindestens 17 von 33. Dafür hast du 60 Minuten Zeit.'],
          [`Wo mache ich den Einbürgerungstest in ${s.de}?`, `Bei einer zugelassenen Prüfstelle in ${s.de}, meist einer Volkshochschule (VHS). Dort meldest du dich an. Der Test kostet 25 Euro.`],
          ['Kann ich den Einbürgerungstest online machen?', 'Nein, die Prüfung findet nur vor Ort statt. Üben kannst du online und kostenlos, zum Beispiel mit Bürgerweg im Browser oder als App.'],
        ],
        othersTitle: 'Einbürgerungstest in anderen Bundesländern',
        open: 'App öffnen',
        homeLabel: 'Startseite',
        skip: 'Zum Inhalt springen',
        nav: 'Hauptnavigation',
        footer: 'Unabhängiges Open-Source-Projekt zur Vorbereitung auf den Einbürgerungstest. Keine Verbindung zum BAMF. Fragen: BAMF-Gesamtfragenkatalog (Stand 07.05.2025).',
        source: 'Quellcode',
        langLabel: 'EN',
        locale: 'de_DE',
        og: 'og-de.png',
      }
    : {
        title: fit([`Einbürgerungstest ${s.en} in English | Bürgerweg`, `Einbürgerungstest ${s.en} | Bürgerweg`]),
        description: fit(
          [
            `Practise the German citizenship test (Einbürgerungstest) for ${s.en} free: 300 general and 10 ${s.en} questions, exam simulator, English translation. No account.`,
            `Practise the Einbürgerungstest for ${s.en} free: 310 questions incl. 10 for ${s.en}, exam simulator, English translation. No account.`,
            `Practise the Einbürgerungstest for ${s.en} free: 310 questions, exam simulator, English translation. No account, offline.`,
          ],
          160,
        ),
        eyebrow: `German citizenship test · ${esc(s.en)}`,
        h1: `Einbürgerungstest ${esc(s.en)}: practise free, in German and English`,
        lead: `If you live in ${esc(s.en)}, 3 questions in your test are about ${esc(s.en)}. Bürgerweg shows exactly the 310 questions that count for you: the 300 general ones and the 10 for ${esc(s.en)}, with an exam simulator and an English translation one tap away.`,
        cta: `Practise ${esc(s.en)} questions`,
        factsTitle: 'The test in numbers',
        f: ['questions in the test', 'minutes', 'correct answers to pass', `questions to practise for ${esc(s.en)}`],
        aboutTitle: `What the test covers in ${esc(s.en)}`,
        aboutLead: 'The test (also called "Leben in Deutschland") is the same across Germany. Only 3 of the 33 questions depend on your federal state.',
        about: [
          `<strong>30 general questions</strong> from the catalogue of 300: politics and democracy, history, society and living together.`,
          `<strong>3 questions about ${esc(s.en)}</strong> from 10 questions for your state, for example about its coat of arms and flag, capital, parliament, elections and government.`,
          `You have <strong>60 minutes</strong>. With <strong>17 correct answers</strong> you pass the citizenship test.`,
        ],
        knowTitle: `Good to know about ${esc(s.en)}`,
        stepsTitle: `How to practise for ${esc(s.en)}`,
        steps: [
          ['Choose your state', `Open Bürgerweg and choose ${esc(s.en)}. The app then shows the 300 general questions and the 10 for ${esc(s.en)}.`],
          ['A few questions a day', 'Set a daily goal, such as 20 questions. The inner ring shows how much you did today.'],
          ['Exam simulator', '33 questions in 60 minutes, like on the day, in German with an English translation one tap away.'],
        ],
        faqTitle: 'Frequently asked questions',
        faq: [
          [`How many questions does the citizenship test have in ${s.en}?`, `33 questions: 30 from the general catalogue of 300 and 3 from the 10 questions for ${s.en}. So you learn 310 questions.`],
          ['How many questions must I answer correctly?', 'At least 17 of 33. You have 60 minutes.'],
          [`Where do I take the Einbürgerungstest in ${s.en}?`, `At an approved test centre in ${s.en}, usually an adult education centre (Volkshochschule, VHS). You register there. The test costs 25 euros.`],
          ['Is the test in German or in English?', 'The test itself is in German. Bürgerweg lets you practise the German questions with an English translation, so you learn the German wording you will see in the test.'],
        ],
        othersTitle: 'Einbürgerungstest in other federal states',
        open: 'Open the app',
        homeLabel: 'Home',
        skip: 'Skip to content',
        nav: 'Main navigation',
        footer: 'Independent open-source project to prepare for the German citizenship test. Not affiliated with the BAMF. Questions: BAMF catalogue (as of 7 May 2025). Translations are unofficial.',
        source: 'Source code',
        langLabel: 'DE',
        locale: 'en_GB',
        og: 'og-en.png',
      };

  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Bürgerweg', item: `{{SITE_URL}}${home}` },
          { '@type': 'ListItem', position: 2, name: `Einbürgerungstest ${name}`, item: `{{SITE_URL}}${self}` },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: t.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
      },
    ],
  };

  const others = STATES.filter((x) => x.code !== s.code)
    .map((x) => `<li><a href="${de ? '' : '/en'}/${x.slug}/">${esc(de ? x.de : x.en)}</a></li>`)
    .join('');

  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(t.title)}</title>
  <meta name="description" content="${esc(t.description)}">
  <link rel="canonical" href="{{SITE_URL}}${self}">
  <link rel="alternate" hreflang="de" href="{{SITE_URL}}/${s.slug}/">
  <link rel="alternate" hreflang="en" href="{{SITE_URL}}/en/${s.slug}/">
  <link rel="alternate" hreflang="x-default" href="{{SITE_URL}}/${s.slug}/">
  <meta name="theme-color" content="#4A4544">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Bürgerweg">
  <meta property="og:locale" content="${t.locale}">
  <meta property="og:title" content="${esc(t.title.replace(' | Bürgerweg', ''))}">
  <meta property="og:description" content="${esc(t.description)}">
  <meta property="og:url" content="{{SITE_URL}}${self}">
  <meta property="og:image" content="{{SITE_URL}}/images/${t.og}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="stylesheet" href="/styles.css">
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
  <a class="skip" href="#main">${t.skip}</a>
  <header class="site-header">
    <div class="wrap">
      <a class="brand" href="${home}" aria-label="Bürgerweg ${t.homeLabel}"><img src="/icon-192.png" alt="" width="34" height="34">Bürgerweg</a>
      <nav class="nav" aria-label="${t.nav}">
        <a class="lang" href="${other}" hreflang="${de ? 'en' : 'de'}" lang="${de ? 'en' : 'de'}">${t.langLabel}</a>
        <a class="btn btn-primary btn-sm" href="/app/">${t.open}</a>
      </nav>
    </div>
  </header>

  <main id="main">
    <section class="hero">
      <div class="wrap">
        <div>
          <nav class="crumbs" aria-label="Breadcrumb"><a href="${home}">Bürgerweg</a> › <span aria-current="page">${esc(name)}</span></nav>
          <span class="eyebrow"><span class="flag-dots" aria-hidden="true"><i style="background:var(--charcoal)"></i><i style="background:var(--red)"></i><i style="background:var(--gold)"></i></span>${t.eyebrow}</span>
          <h1>${t.h1}</h1>
          <p class="lead">${t.lead}</p>
          <div class="cta"><a class="btn btn-primary" href="/app/">${t.cta}</a></div>
        </div>
        <div class="hero-art">
          <img class="scene" src="/images/hero.svg" alt="" width="460" height="460">
          <img class="phone" src="/images/${lang}-home.webp" alt="${de ? 'Bürgerweg Startseite mit Lernfortschritt' : 'Bürgerweg home screen with learning progress'}" width="482" height="971" fetchpriority="high">
        </div>
      </div>
    </section>

    <section class="facts" aria-label="${t.factsTitle}">
      <div class="wrap">
        <ul>
          <li><strong>33</strong><span>${t.f[0]}</span></li>
          <li><strong>60</strong><span>${t.f[1]}</span></li>
          <li><strong>17</strong><span>${t.f[2]}</span></li>
          <li><strong>310</strong><span>${t.f[3]}</span></li>
        </ul>
      </div>
    </section>

    <section class="section">
      <div class="wrap narrow">
        <h2 class="section-title">${t.aboutTitle}</h2>
        <p class="section-lead">${t.aboutLead}</p>
        <ul class="checks">${t.about.map((x) => `<li>${x}</li>`).join('')}</ul>
        <h3 class="sub-title">${t.knowTitle}</h3>
        <ul class="checks">${facts(s, lang).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      </div>
    </section>

    <section class="section alt">
      <div class="wrap">
        <h2 class="section-title">${t.stepsTitle}</h2>
        <div class="cards">${t.steps
          .map(([h, p], i) => `<div class="card"><span class="step-no">${i + 1}</span><h3>${h}</h3><p>${p}</p></div>`)
          .join('')}</div>
        <div class="cta center"><a class="btn btn-primary" href="/app/">${t.cta}</a></div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <h2 class="section-title">${t.faqTitle}</h2>
        <div class="faq">${t.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
      </div>
    </section>

    <section class="section alt">
      <div class="wrap">
        <h2 class="section-title">${t.othersTitle}</h2>
        <ul class="state-links">${others}</ul>
      </div>
    </section>
  </main>

  <footer>
    <div class="wrap">
      <div>
        <h2>Bürgerweg</h2>
        <p>${t.footer}</p>
      </div>
      <div>
        <h2>Links</h2>
        <ul>
          <li><a href="${home}">${t.homeLabel}</a></li>
          <li><a href="/app/">${t.open}</a></li>
          <li><a href="{{REPO_URL}}">${t.source}</a></li>
        </ul>
      </div>
      <div>
        <p>© {{YEAR}} Bürgerweg contributors</p>
      </div>
    </div>
  </footer>
</body>
</html>
`;
}
