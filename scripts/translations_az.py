"""Build src/data/translations/az.json (Azerbaijani question translations) from the German catalog.

  python3 scripts/translations_az.py

Inputs:  src/data/questions.de.json      (German questions, the source; never edited here)
         scripts/catalog/az/p*.json      (the 300 general questions: "id": [question, option 1..4])
The 160 state questions follow ten German patterns, so they are translated by the templates below. Unlike
build_data.py (English), this needs no raw PDF output. Translation rules: docs/question-data.md#translation-rules.
"""
import glob
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DE = json.load(open(os.path.join(ROOT, 'src', 'data', 'questions.de.json')))

general = {}
for f in sorted(glob.glob(os.path.join(ROOT, 'scripts', 'catalog', 'az', 'p*.json'))):
    general.update(json.load(open(f)))

# Azerbaijani names with the case forms the templates need (vowel harmony makes suffixes name-specific).
#   name, genitive (-ın/-in/-un/-ün), locative (-da/-də)
STATE = {
    'BW': ('Baden-Vürtemberq', 'Baden-Vürtemberqin', 'Baden-Vürtemberqdə'),
    'BY': ('Bavariya', 'Bavariyanın', 'Bavariyada'),
    'BE': ('Berlin', 'Berlinin', 'Berlində'),
    'BB': ('Brandenburq', 'Brandenburqun', 'Brandenburqda'),
    'HB': ('Bremen', 'Bremenin', 'Bremendə'),
    'HH': ('Hamburq', 'Hamburqun', 'Hamburqda'),
    'HE': ('Hessen', 'Hessenin', 'Hessendə'),
    'MV': ('Meklenburq-Ön Pomeraniya', 'Meklenburq-Ön Pomeraniyanın', 'Meklenburq-Ön Pomeraniyada'),
    'NI': ('Aşağı Saksoniya', 'Aşağı Saksoniyanın', 'Aşağı Saksoniyada'),
    'NW': ('Şimali Reyn-Vestfaliya', 'Şimali Reyn-Vestfaliyanın', 'Şimali Reyn-Vestfaliyada'),
    'RP': ('Reynland-Pfals', 'Reynland-Pfalsın', 'Reynland-Pfalsda'),
    'SL': ('Saarland', 'Saarlandın', 'Saarlandda'),
    'SN': ('Saksoniya', 'Saksoniyanın', 'Saksoniyada'),
    'ST': ('Saksoniya-Anhalt', 'Saksoniya-Anhaltın', 'Saksoniya-Anhaltda'),
    'SH': ('Şlezviq-Holşteyn', 'Şlezviq-Holşteynin', 'Şlezviq-Holşteyndə'),
    'TH': ('Türingiya', 'Türingiyanın', 'Türingiyada'),
}
STATE_BY_DE = {
    'Bayern': 'Bavariya', 'Berlin': 'Berlin', 'Brandenburg': 'Brandenburq', 'Bremen': 'Bremen', 'Hamburg': 'Hamburq',
    'Hessen': 'Hessen', 'Saarland': 'Saarland', 'Sachsen': 'Saksoniya', 'Thüringen': 'Türingiya',
}
COLORS = {'blau': 'mavi', 'weiß': 'ağ', 'rot': 'qırmızı', 'schwarz': 'qara', 'gold': 'qızılı', 'grün': 'yaşıl',
          'gelb': 'sarı'}
# Titles and places to ask about. No German term in brackets here: it would mark the real German titles.
OPT = {
    'beim Ordnungsamt der Gemeinde': 'bələdiyyənin ictimai asayiş idarəsində',
    'bei der Verbraucherzentrale': 'istehlakçılara məsləhət mərkəzində',
    'bei der Landeszentrale für politische Bildung': 'əyalətin siyasi maarifləndirmə mərkəzində',
    'bei den Kirchen': 'kilsələrdə',
    'beim / bei der Landesbeauftragten für politische Bildung': 'əyalətin siyasi maarifləndirmə üzrə müvəkkilində',
    'Erste Ministerin/Erster Minister': 'Birinci nazir',
    'Premierministerin/Premierminister': 'Premyer-nazir',
    'Bürgermeisterin/Bürgermeister': 'Bələdiyyə sədri',
    'Ministerpräsidentin/Ministerpräsident': 'Baş nazir',
    'Oberbürgermeisterin/Oberbürgermeister': 'Ali bələdiyyə sədri',
    'Präsidentin/Präsident des Senates': 'Senatın prezidenti',
    'Regierende Bürgermeisterin/Regierender Bürgermeister': 'İdarəedici bələdiyyə sədri',
    'Erste Bürgermeisterin/Erster Bürgermeister': 'Birinci bələdiyyə sədri',
    'Regierende Senatorin/Regierender Senator': 'İdarəedici senator',
    'Finanzministerin/Finanzminister': 'Maliyyə naziri',
    'Justizministerin/Justizminister': 'Ədliyyə naziri',
    'Innenministerin/Innenminister': 'Daxili işlər naziri',
    'Außenministerin/Außenminister': 'Xarici işlər naziri',
    'Finanzsenatorin/Finanzsenator': 'Maliyyə senatoru',
    'Innensenatorin/Innensenator': 'Daxili işlər senatoru',
    'Justizsenatorin/Justizsenator': 'Ədliyyə senatoru',
    'Senatorin/Senator für Außenbeziehungen': 'Xarici əlaqələr üzrə senator',
    'Frankfurt/Oder.': 'Frankfurt (Oder).',
}


def option(o):
    if o in OPT:
        return OPT[o]
    if o in STATE_BY_DE:
        return STATE_BY_DE[o]
    if re.fullmatch(r'Bild \d', o):
        return 'Şəkil ' + o[-1]
    if re.fullmatch(r'[a-zäöüß]+(-[a-zäöüß]+)+', o):
        return '-'.join(COLORS[c] for c in o.split('-'))
    return o  # numbers, city and district names stay as in German


def state_question(q):
    s, n, de = q['s'], q['n'], q['q']
    name, gen, loc = STATE[s]
    if n == 1:
        if 'Freistaat' in de:
            return f'{name} Azad Dövlətinin (Freistaat) gerbi hansıdır?'
        if 'Freien und Hansestadt' in de:
            return 'Azad və Hanza Şəhəri Hamburqun gerbi hansıdır?'
        if 'Freien Hansestadt' in de:
            return 'Azad Hanza Şəhəri Bremenin gerbi hansıdır?'
        return f'{name} federal əyalətinin gerbi hansıdır?'
    if n == 2:
        if 'Bezirk' in de:
            return f'{gen} rayonlarından (Bezirk) biri hansıdır?'
        if 'Stadtteil' in de:
            return f'{gen} məhəllələrindən (Stadtteil) biri hansıdır?'
        return f'{loc} yerləşən dairə (Landkreis) hansıdır?'
    if n == 3:
        body = 'əyalət parlamenti (Landtag)' if 'Landtag' in de else 'əyalət parlamenti'
        return f'{loc} {body} neçə illiyə seçilir?'
    if n == 4:
        if 'Bürgerschaft' in de:
            return f'{loc} Bürgerschaft (Landtag) seçkilərində neçə yaşından səs vermək olar?'
        if 'Bezirksverordnetenversammlung' in de:
            return f'{loc} bələdiyyə seçkilərində (rayon nümayəndələri məclisinin seçkisi) neçə yaşından səs vermək olar?'
        if 'Bezirksversammlungen' in de:
            return f'{loc} bələdiyyə seçkilərində (rayon məclislərinin seçkisi) neçə yaşından səs vermək olar?'
        return f'{loc} bələdiyyə seçkilərində neçə yaşından səs vermək olar?'
    if n == 5:
        return f'{gen} əyalət bayrağı hansı rənglərdədir?'
    if n == 6:
        return f'{loc} siyasi mövzular haqqında haradan məlumat ala bilərsiniz?'
    if n == 7:
        if de.startswith('Was ist ein deutscher Stadtstaat'):
            return 'Alman şəhər-dövləti hansıdır?'
        if 'Stadtstaat' in de:
            return 'Hansı federal əyalət şəhər-dövlətdir?'
        return f'{gen} paytaxtı … adlanır.'
    if n == 8:
        return f'{name} hansı federal əyalətdir?'
    if n == 9:
        if 'Stadtstaates' in de:
            return f'{name} şəhər-dövlətinin hökumət başçısı necə adlanır?'
        return f'{loc} hökumət başçısı necə adlanır?'
    if n == 10:
        kind = 'senatoru' if 'Senator' in de else 'naziri'
        return f'{gen} hansı {kind} yoxdur?'
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
path = os.path.join(ROOT, 'src', 'data', 'translations', 'az.json')
json.dump(out, open(path, 'w'), ensure_ascii=False, separators=(',', ':'))
print(f'wrote {len(out)} translations to {os.path.relpath(path, ROOT)}')
