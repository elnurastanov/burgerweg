"""Build src/data/translations/tr.json (Turkish question translations) from the German catalog.

  python3 scripts/translations_tr.py

Inputs:  src/data/questions.de.json      (German questions, the source; never edited here)
         scripts/catalog/tr/p*.json      (the 300 general questions: "id": [question, option 1..4])
The 160 state questions follow ten German patterns, so they are translated by the templates below.
Translation rules: docs/question-data.md#translation-rules.
"""
import glob
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DE = json.load(open(os.path.join(ROOT, 'src', 'data', 'questions.de.json')))

general = {}
for f in sorted(glob.glob(os.path.join(ROOT, 'scripts', 'catalog', 'tr', 'p*.json'))):
    general.update(json.load(open(f)))

# Turkish names with the case forms the templates need. Proper nouns take their suffix after an apostrophe, and
# vowel harmony and the final consonant make each suffix name-specific.
#   name, genitive (-ın/-in/-un/-ün/-nın), locative (-da/-de/-ta/-te)
STATE = {
    'BW': ('Baden-Württemberg', "Baden-Württemberg'in", "Baden-Württemberg'de"),
    'BY': ('Bavyera', "Bavyera'nın", "Bavyera'da"),
    'BE': ('Berlin', "Berlin'in", "Berlin'de"),
    'BB': ('Brandenburg', "Brandenburg'un", "Brandenburg'da"),
    'HB': ('Bremen', "Bremen'in", "Bremen'de"),
    'HH': ('Hamburg', "Hamburg'un", "Hamburg'da"),
    'HE': ('Hessen', "Hessen'in", "Hessen'de"),
    'MV': ('Mecklenburg-Ön Pomeranya', "Mecklenburg-Ön Pomeranya'nın", "Mecklenburg-Ön Pomeranya'da"),
    'NI': ('Aşağı Saksonya', "Aşağı Saksonya'nın", "Aşağı Saksonya'da"),
    'NW': ('Kuzey Ren-Vestfalya', "Kuzey Ren-Vestfalya'nın", "Kuzey Ren-Vestfalya'da"),
    'RP': ('Renanya-Palatina', "Renanya-Palatina'nın", "Renanya-Palatina'da"),
    'SL': ('Saarland', "Saarland'ın", "Saarland'da"),
    'SN': ('Saksonya', "Saksonya'nın", "Saksonya'da"),
    'ST': ('Saksonya-Anhalt', "Saksonya-Anhalt'ın", "Saksonya-Anhalt'ta"),
    'SH': ('Schleswig-Holstein', "Schleswig-Holstein'ın", "Schleswig-Holstein'da"),
    'TH': ('Thüringen', "Thüringen'in", "Thüringen'de"),
}
STATE_BY_DE = {
    'Bayern': 'Bavyera', 'Berlin': 'Berlin', 'Brandenburg': 'Brandenburg', 'Bremen': 'Bremen', 'Hamburg': 'Hamburg',
    'Hessen': 'Hessen', 'Saarland': 'Saarland', 'Sachsen': 'Saksonya', 'Thüringen': 'Thüringen',
}
COLORS = {'blau': 'mavi', 'weiß': 'beyaz', 'rot': 'kırmızı', 'schwarz': 'siyah', 'gold': 'altın', 'grün': 'yeşil',
          'gelb': 'sarı'}
# Titles and places to ask about. No German term in brackets here: it would mark the real German titles.
OPT = {
    'beim Ordnungsamt der Gemeinde': 'belediyenin zabıta dairesinde',
    'bei der Verbraucherzentrale': 'tüketici danışma merkezinde',
    'bei der Landeszentrale für politische Bildung': 'eyaletin siyasi eğitim merkezinde',
    'bei den Kirchen': 'kiliselerde',
    'beim / bei der Landesbeauftragten für politische Bildung': 'eyaletin siyasi eğitim sorumlusunda',
    'Erste Ministerin/Erster Minister': 'Birinci Bakan',
    'Premierministerin/Premierminister': 'Başbakan',
    'Bürgermeisterin/Bürgermeister': 'Belediye Başkanı',
    'Ministerpräsidentin/Ministerpräsident': 'Bakan-Başkan',
    'Oberbürgermeisterin/Oberbürgermeister': 'Büyükşehir Belediye Başkanı',
    'Präsidentin/Präsident des Senates': 'Senato Başkanı',
    'Regierende Bürgermeisterin/Regierender Bürgermeister': 'Yöneten Belediye Başkanı',
    'Erste Bürgermeisterin/Erster Bürgermeister': 'Birinci Belediye Başkanı',
    'Regierende Senatorin/Regierender Senator': 'Yöneten Senatör',
    'Finanzministerin/Finanzminister': 'Maliye Bakanı',
    'Justizministerin/Justizminister': 'Adalet Bakanı',
    'Innenministerin/Innenminister': 'İçişleri Bakanı',
    'Außenministerin/Außenminister': 'Dışişleri Bakanı',
    'Finanzsenatorin/Finanzsenator': 'Maliye Senatörü',
    'Innensenatorin/Innensenator': 'İçişleri Senatörü',
    'Justizsenatorin/Justizsenator': 'Adalet Senatörü',
    'Senatorin/Senator für Außenbeziehungen': 'Dış İlişkiler Senatörü',
    'Frankfurt/Oder.': 'Frankfurt (Oder).',
}


def option(o):
    if o in OPT:
        return OPT[o]
    if o in STATE_BY_DE:
        return STATE_BY_DE[o]
    if re.fullmatch(r'Bild \d', o):
        return 'Resim ' + o[-1]
    if re.fullmatch(r'[a-zäöüß]+(-[a-zäöüß]+)+', o):
        return '-'.join(COLORS[c] for c in o.split('-'))
    return o  # numbers, city and district names stay as in German


def state_question(q):
    s, n, de = q['s'], q['n'], q['q']
    name, gen, loc = STATE[s]
    if n == 1:
        if 'Freistaat' in de:
            return f'Özgür Devlet (Freistaat) {gen} arması hangisidir?'
        if 'Freien und Hansestadt' in de:
            return "Özgür ve Hansa Şehri Hamburg'un arması hangisidir?"
        if 'Freien Hansestadt' in de:
            return "Özgür Hansa Şehri Bremen'in arması hangisidir?"
        return f'{name} federal eyaletinin arması hangisidir?'
    if n == 2:
        if 'Bezirk' in de:
            return f'Hangisi {gen} bir ilçesidir (Bezirk)?'
        if 'Stadtteil' in de:
            return f'Hangisi {gen} bir semtidir (Stadtteil)?'
        return f"Hangisi {loc} bir ilçedir (Landkreis)?"
    if n == 3:
        body = 'eyalet parlamentosu (Landtag)' if 'Landtag' in de else 'eyalet parlamentosu'
        return f'{loc} {body} kaç yıllığına seçilir?'
    if n == 4:
        if 'Bürgerschaft' in de:
            return f'{loc} Bürgerschaft (Landtag) seçimlerinde kaç yaşından itibaren oy kullanılabilir?'
        if 'Bezirksverordnetenversammlung' in de:
            return f'{loc} yerel seçimlerde (ilçe temsilcileri meclisi seçimi) kaç yaşından itibaren oy kullanılabilir?'
        if 'Bezirksversammlungen' in de:
            return f'{loc} yerel seçimlerde (ilçe meclisleri seçimi) kaç yaşından itibaren oy kullanılabilir?'
        return f'{loc} yerel seçimlerde kaç yaşından itibaren oy kullanılabilir?'
    if n == 5:
        return f'{gen} eyalet bayrağı hangi renklerdedir?'
    if n == 6:
        return f'{loc} siyasi konular hakkında nereden bilgi alabilirsiniz?'
    if n == 7:
        if de.startswith('Was ist ein deutscher Stadtstaat'):
            return 'Hangisi bir Alman şehir devletidir?'
        if 'Stadtstaat' in de:
            return 'Hangi federal eyalet bir şehir devletidir?'
        return f'{gen} eyalet başkentinin adı …'
    if n == 8:
        return f'{name} hangi federal eyalettir?'
    if n == 9:
        if 'Stadtstaates' in de:
            return f'{name} şehir devletinin hükümet başkanına ne ad verilir?'
        return f'{loc} hükümet başkanına ne ad verilir?'
    if n == 10:
        kind = 'senatörü' if 'Senator' in de else 'bakanı'
        return f'{gen} hangi {kind} yoktur?'
    raise ValueError(q['id'])


out = {}
for q in DE:
    if q['s']:
        out[q['id']] = {'q': state_question(q), 'o': [option(o) for o in q['o']]}
    else:
        row = general[q['id']]
        assert len(row) == 1 + len(q['o']), q['id']
        out[q['id']] = {'q': row[0], 'o': row[1:]}

assert len(out) == len(DE) == 460
for qid, t in out.items():
    assert t['q'] and all(t['o']), qid
path = os.path.join(ROOT, 'src', 'data', 'translations', 'tr.json')
json.dump(out, open(path, 'w'), ensure_ascii=False, separators=(',', ':'))
print(f'wrote {len(out)} translations to {os.path.relpath(path, ROOT)}')
