"""Build src/data/translations/uk.json (Ukrainian question translations) from the German catalog.

  python3 scripts/translations_uk.py

Inputs:  src/data/questions.de.json      (German questions, the source; never edited here)
         scripts/catalog/uk/p*.json      (the 300 general questions: "id": [question, option 1..4])
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
for f in sorted(glob.glob(os.path.join(ROOT, 'scripts', 'catalog', 'uk', 'p*.json'))):
    general.update(json.load(open(f)))

# Ukrainian names with the case forms the templates need.
#   name, genitive, locative with its preposition (у …)
STATE = {
    'BW': ('Баден-Вюртемберг', 'Баден-Вюртембергу', 'у Баден-Вюртемберзі'),
    'BY': ('Баварія', 'Баварії', 'у Баварії'),
    'BE': ('Берлін', 'Берліна', 'у Берліні'),
    'BB': ('Бранденбург', 'Бранденбургу', 'у Бранденбурзі'),
    'HB': ('Бремен', 'Бремена', 'у Бремені'),
    'HH': ('Гамбург', 'Гамбурга', 'у Гамбурзі'),
    'HE': ('Гессен', 'Гессену', 'у Гессені'),
    'MV': ('Мекленбург-Передня Померанія', 'Мекленбургу-Передньої Померанії', 'у Мекленбурзі-Передній Померанії'),
    'NI': ('Нижня Саксонія', 'Нижньої Саксонії', 'у Нижній Саксонії'),
    'NW': ('Північний Рейн-Вестфалія', 'Північного Рейну-Вестфалії', 'у Північному Рейні-Вестфалії'),
    'RP': ('Рейнланд-Пфальц', 'Рейнланд-Пфальцу', 'у Рейнланд-Пфальці'),
    'SL': ('Саар', 'Саару', 'у Саарі'),
    'SN': ('Саксонія', 'Саксонії', 'у Саксонії'),
    'ST': ('Саксонія-Ангальт', 'Саксонії-Ангальт', 'у Саксонії-Ангальт'),
    'SH': ('Шлезвіг-Гольштейн', 'Шлезвіг-Гольштейну', 'у Шлезвіг-Гольштейні'),
    'TH': ('Тюрингія', 'Тюрингії', 'у Тюрингії'),
}
STATE_BY_DE = {
    'Bayern': 'Баварія',
    'Berlin': 'Берлін',
    'Brandenburg': 'Бранденбург',
    'Bremen': 'Бремен',
    'Hamburg': 'Гамбург',
    'Hessen': 'Гессен',
    'Saarland': 'Саар',
    'Sachsen': 'Саксонія',
    'Thüringen': 'Тюрингія',
}
COLORS = {'blau': 'синій', 'weiß': 'білий', 'rot': 'червоний', 'schwarz': 'чорний', 'gold': 'золотий', 'grün': 'зелений', 'gelb': 'жовтий'}
# Titles and places to ask about. No German term in brackets here: it would mark the real German titles.
OPT = {
    'beim Ordnungsamt der Gemeinde': 'у відомстві громадського порядку громади',
    'bei der Verbraucherzentrale': 'у центрі захисту прав споживачів',
    'bei der Landeszentrale für politische Bildung': 'у земельному центрі політичної освіти',
    'bei den Kirchen': 'у церквах',
    'beim / bei der Landesbeauftragten für politische Bildung': 'в уповноваженого землі з політичної освіти',
    'Erste Ministerin/Erster Minister': 'Перший міністр',
    'Premierministerin/Premierminister': "Прем’єр-міністр",
    'Bürgermeisterin/Bürgermeister': 'Бургомістр',
    'Ministerpräsidentin/Ministerpräsident': 'Міністр-президент',
    'Oberbürgermeisterin/Oberbürgermeister': 'Обер-бургомістр',
    'Präsidentin/Präsident des Senates': 'Голова сенату',
    'Regierende Bürgermeisterin/Regierender Bürgermeister': 'Правлячий бургомістр',
    'Erste Bürgermeisterin/Erster Bürgermeister': 'Перший бургомістр',
    'Regierende Senatorin/Regierender Senator': 'Правлячий сенатор',
    'Finanzministerin/Finanzminister': 'Міністр фінансів',
    'Justizministerin/Justizminister': 'Міністр юстиції',
    'Innenministerin/Innenminister': 'Міністр внутрішніх справ',
    'Außenministerin/Außenminister': 'Міністр закордонних справ',
    'Finanzsenatorin/Finanzsenator': 'Сенатор з фінансів',
    'Innensenatorin/Innensenator': 'Сенатор з внутрішніх справ',
    'Justizsenatorin/Justizsenator': 'Сенатор юстиції',
    'Senatorin/Senator für Außenbeziehungen': "Сенатор із зовнішніх зв’язків",
    'Frankfurt/Oder.': 'Frankfurt (Oder).',
}


def option(o):
    if o in OPT:
        return OPT[o]
    if o in STATE_BY_DE:
        return STATE_BY_DE[o]
    if re.fullmatch(r'Bild \d', o):
        return 'Малюнок ' + o[-1]
    if re.fullmatch(r'[a-zäöüß]+(-[a-zäöüß]+)+', o):
        return '-'.join(COLORS[c] for c in o.split('-'))
    return o  # numbers, city and district names stay as in German


def state_question(q):
    s, n, de = q['s'], q['n'], q['q']
    name, gen, loc = STATE[s]
    if n == 1:
        if 'Freistaat' in de:
            return f'Який герб належить Вільній державі (Freistaat) {name}?'
        if 'Freien und Hansestadt' in de:
            return 'Який герб належить Вільному і ганзейському місту Гамбург?'
        if 'Freien Hansestadt' in de:
            return 'Який герб належить Вільному ганзейському місту Бремен?'
        return f'Який герб належить федеральній землі {name}?'
    if n == 2:
        if 'Bezirk' in de:
            return f'Що з переліченого — район (Bezirk) {gen}?'
        if 'Stadtteil' in de:
            return f'Що з переліченого — частина міста (Stadtteil) {gen}?'
        return f'Що з переліченого — район (Landkreis) {loc}?'
    if n == 3:
        body = 'ландтаг (Landtag)' if 'Landtag' in de else 'парламент землі'
        return f'На скільки років {loc} обирають {body}?'
    if n == 4:
        if 'Bürgerschaft' in de:
            return f'З якого віку {loc} можна голосувати на виборах до бюргершафту (Bürgerschaft, ландтаг)?'
        if 'Bezirksverordnetenversammlung' in de:
            return f'З якого віку {loc} можна голосувати на муніципальних виборах (виборах районних зборів депутатів)?'
        if 'Bezirksversammlungen' in de:
            return f'З якого віку {loc} можна голосувати на муніципальних виборах (виборах районних зборів)?'
        return f'З якого віку {loc} можна голосувати на муніципальних виборах?'
    if n == 5:
        return f'Які кольори має прапор землі {name}?'
    if n == 6:
        return f'Де {loc} можна отримати інформацію на політичні теми?'
    if n == 7:
        if de.startswith('Was ist ein deutscher Stadtstaat'):
            return 'Що є німецьким містом-державою?'
        if 'Stadtstaat' in de:
            return 'Яка федеральна земля є містом-державою?'
        return f'Столиця землі {name} називається …'
    if n == 8:
        return f'Яка федеральна земля — {name}?'
    if n == 9:
        if 'Stadtstaates' in de:
            return f'Як називається очільник уряду міста-держави {name}?'
        return f'Як називається очільник уряду {loc}?'
    if n == 10:
        kind = 'сенатора' if 'Senator' in de else 'міністра'
        return f'Якого {kind} немає {loc}?'
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
path = os.path.join(ROOT, 'src', 'data', 'translations', 'uk.json')
json.dump(out, open(path, 'w'), ensure_ascii=False, separators=(',', ':'))
print(f'wrote {len(out)} translations to {os.path.relpath(path, ROOT)}')
