"""Build src/data/translations/ru.json (Russian question translations) from the German catalog.

  python3 scripts/translations_ru.py

Inputs:  src/data/questions.de.json      (German questions, the source; never edited here)
         scripts/catalog/ru/p*.json      (the 300 general questions: "id": [question, option 1..4])
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
for f in sorted(glob.glob(os.path.join(ROOT, 'scripts', 'catalog', 'ru', 'p*.json'))):
    general.update(json.load(open(f)))

# Russian names with the case forms the templates need.
#   name, genitive, locative with its preposition (в …)
STATE = {
    'BW': ('Баден-Вюртемберг', 'Баден-Вюртемберга', 'в Баден-Вюртемберге'),
    'BY': ('Бавария', 'Баварии', 'в Баварии'),
    'BE': ('Берлин', 'Берлина', 'в Берлине'),
    'BB': ('Бранденбург', 'Бранденбурга', 'в Бранденбурге'),
    'HB': ('Бремен', 'Бремена', 'в Бремене'),
    'HH': ('Гамбург', 'Гамбурга', 'в Гамбурге'),
    'HE': ('Гессен', 'Гессена', 'в Гессене'),
    'MV': ('Мекленбург-Передняя Померания', 'Мекленбурга-Передней Померании', 'в Мекленбурге-Передней Померании'),
    'NI': ('Нижняя Саксония', 'Нижней Саксонии', 'в Нижней Саксонии'),
    'NW': ('Северный Рейн-Вестфалия', 'Северного Рейна-Вестфалии', 'в Северном Рейне-Вестфалии'),
    'RP': ('Рейнланд-Пфальц', 'Рейнланд-Пфальца', 'в Рейнланд-Пфальце'),
    'SL': ('Саар', 'Саара', 'в Сааре'),
    'SN': ('Саксония', 'Саксонии', 'в Саксонии'),
    'ST': ('Саксония-Анхальт', 'Саксонии-Анхальт', 'в Саксонии-Анхальт'),
    'SH': ('Шлезвиг-Гольштейн', 'Шлезвиг-Гольштейна', 'в Шлезвиг-Гольштейне'),
    'TH': ('Тюрингия', 'Тюрингии', 'в Тюрингии'),
}
STATE_BY_DE = {
    'Bayern': 'Бавария',
    'Berlin': 'Берлин',
    'Brandenburg': 'Бранденбург',
    'Bremen': 'Бремен',
    'Hamburg': 'Гамбург',
    'Hessen': 'Гессен',
    'Saarland': 'Саар',
    'Sachsen': 'Саксония',
    'Thüringen': 'Тюрингия',
}
COLORS = {'blau': 'синий', 'weiß': 'белый', 'rot': 'красный', 'schwarz': 'чёрный', 'gold': 'золотой', 'grün': 'зелёный', 'gelb': 'жёлтый'}
# Titles and places to ask about. No German term in brackets here: it would mark the real German titles.
OPT = {
    'beim Ordnungsamt der Gemeinde': 'в ведомстве общественного порядка общины',
    'bei der Verbraucherzentrale': 'в центре защиты прав потребителей',
    'bei der Landeszentrale für politische Bildung': 'в земельном центре политического образования',
    'bei den Kirchen': 'в церквях',
    'beim / bei der Landesbeauftragten für politische Bildung': 'у уполномоченного земли по политическому образованию',
    'Erste Ministerin/Erster Minister': 'Первый министр',
    'Premierministerin/Premierminister': 'Премьер-министр',
    'Bürgermeisterin/Bürgermeister': 'Бургомистр',
    'Ministerpräsidentin/Ministerpräsident': 'Министр-президент',
    'Oberbürgermeisterin/Oberbürgermeister': 'Обер-бургомистр',
    'Präsidentin/Präsident des Senates': 'Председатель сената',
    'Regierende Bürgermeisterin/Regierender Bürgermeister': 'Правящий бургомистр',
    'Erste Bürgermeisterin/Erster Bürgermeister': 'Первый бургомистр',
    'Regierende Senatorin/Regierender Senator': 'Правящий сенатор',
    'Finanzministerin/Finanzminister': 'Министр финансов',
    'Justizministerin/Justizminister': 'Министр юстиции',
    'Innenministerin/Innenminister': 'Министр внутренних дел',
    'Außenministerin/Außenminister': 'Министр иностранных дел',
    'Finanzsenatorin/Finanzsenator': 'Сенатор по финансам',
    'Innensenatorin/Innensenator': 'Сенатор по внутренним делам',
    'Justizsenatorin/Justizsenator': 'Сенатор юстиции',
    'Senatorin/Senator für Außenbeziehungen': 'Сенатор по внешним связям',
    'Frankfurt/Oder.': 'Frankfurt (Oder).',
}


def option(o):
    if o in OPT:
        return OPT[o]
    if o in STATE_BY_DE:
        return STATE_BY_DE[o]
    if re.fullmatch(r'Bild \d', o):
        return 'Рисунок ' + o[-1]
    if re.fullmatch(r'[a-zäöüß]+(-[a-zäöüß]+)+', o):
        return '-'.join(COLORS[c] for c in o.split('-'))
    return o  # numbers, city and district names stay as in German


def state_question(q):
    s, n, de = q['s'], q['n'], q['q']
    name, gen, loc = STATE[s]
    if n == 1:
        if 'Freistaat' in de:
            return f'Какой герб принадлежит Свободному государству (Freistaat) {name}?'
        if 'Freien und Hansestadt' in de:
            return 'Какой герб принадлежит Вольному и ганзейскому городу Гамбург?'
        if 'Freien Hansestadt' in de:
            return 'Какой герб принадлежит Вольному ганзейскому городу Бремен?'
        return f'Какой герб принадлежит федеральной земле {name}?'
    if n == 2:
        if 'Bezirk' in de:
            return f'Что из перечисленного — район (Bezirk) {gen}?'
        if 'Stadtteil' in de:
            return f'Что из перечисленного — часть города (Stadtteil) {gen}?'
        return f'Что из перечисленного — район (Landkreis) {loc}?'
    if n == 3:
        body = 'ландтаг (Landtag)' if 'Landtag' in de else 'парламент земли'
        return f'На сколько лет {loc} избирается {body}?'
    if n == 4:
        if 'Bürgerschaft' in de:
            return f'С какого возраста {loc} можно голосовать на выборах в бюргершафт (Bürgerschaft, ландтаг)?'
        if 'Bezirksverordnetenversammlung' in de:
            return f'С какого возраста {loc} можно голосовать на муниципальных выборах (выборах районных собраний депутатов)?'
        if 'Bezirksversammlungen' in de:
            return f'С какого возраста {loc} можно голосовать на муниципальных выборах (выборах районных собраний)?'
        return f'С какого возраста {loc} можно голосовать на муниципальных выборах?'
    if n == 5:
        return f'Какие цвета у флага земли {name}?'
    if n == 6:
        return f'Где {loc} можно получить информацию на политические темы?'
    if n == 7:
        if de.startswith('Was ist ein deutscher Stadtstaat'):
            return 'Что является немецким городом-государством?'
        if 'Stadtstaat' in de:
            return 'Какая федеральная земля является городом-государством?'
        return f'Столица земли {name} называется …'
    if n == 8:
        return f'Какая федеральная земля — {name}?'
    if n == 9:
        if 'Stadtstaates' in de:
            return f'Как называется глава правительства города-государства {name}?'
        return f'Как называется глава правительства {loc}?'
    if n == 10:
        kind = 'сенатора' if 'Senator' in de else 'министра'
        return f'Какого {kind} нет {loc}?'
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
path = os.path.join(ROOT, 'src', 'data', 'translations', 'ru.json')
json.dump(out, open(path, 'w'), ensure_ascii=False, separators=(',', ':'))
print(f'wrote {len(out)} translations to {os.path.relpath(path, ROOT)}')
