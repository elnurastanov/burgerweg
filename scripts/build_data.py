"""Merge parsed BAMF questions + answers/translations into app data files."""
import json
import os
import re
import shutil

from PIL import Image
import sys

src_json, en_dir, img_dir, out_dir = sys.argv[1:5]
qs = json.load(open(src_json))

en = {}
for f in sorted(os.listdir(en_dir)):
    en.update(json.load(open(os.path.join(en_dir, f))))

# fixes for captions that leaked into the question text
FIX_Q = {"g130": "Welcher Stimmzettel wäre bei einer Bundestagswahl gültig?"}

STATE_EN = {
    "BW": "Baden-Württemberg", "BY": "Bavaria", "BE": "Berlin", "BB": "Brandenburg", "HB": "Bremen",
    "HH": "Hamburg", "HE": "Hesse", "MV": "Mecklenburg-Western Pomerania", "NI": "Lower Saxony",
    "NW": "North Rhine-Westphalia", "RP": "Rhineland-Palatinate", "SL": "Saarland", "SN": "Saxony",
    "ST": "Saxony-Anhalt", "SH": "Schleswig-Holstein", "TH": "Thuringia",
}
STATE_FULL_EN = {
    "BY": "the Free State of Bavaria", "SN": "the Free State of Saxony", "TH": "the Free State of Thuringia",
    "HB": "the Free Hanseatic City of Bremen", "HH": "the Free and Hanseatic City of Hamburg",
}
COAT = {"BW": 1, "BY": 2, "BE": 4, "BB": 1, "HB": 3, "HH": 2, "HE": 1, "MV": 3, "NI": 3, "NW": 2,
        "RP": 1, "SL": 4, "SN": 4, "ST": 4, "SH": 3, "TH": 4}
MAP = {"BW": 2, "BY": 4, "BE": 4, "BB": 4, "HB": 1, "HH": 3, "HE": 3, "MV": 3, "NI": 1, "NW": 3,
       "RP": 1, "SL": 2, "SN": 4, "ST": 3, "SH": 1, "TH": 2}
DISTRICT = {"BW": "Neckar-Odenwald-Kreis", "BY": "Altötting", "BE": "Pankow", "BB": "Prignitz",
            "HB": "Hemelingen", "HH": "Altona", "HE": "Main-Taunus-Kreis", "MV": "Mecklenburgische Seenplatte",
            "NI": "Ammerland", "NW": "Rhein-Sieg-Kreis", "RP": "Westerwaldkreis", "SL": "Neunkirchen",
            "SN": "Vogtlandkreis", "ST": "Börde", "SH": "Nordfriesland", "TH": "Wartburgkreis"}
CAPITAL = {"BW": "Stuttgart.", "BY": "München.", "BB": "Potsdam.", "HE": "Wiesbaden.", "MV": "Schwerin.",
           "NI": "Hannover.", "NW": "Düsseldorf.", "RP": "Mainz.", "SL": "Saarbrücken.", "SN": "Dresden.",
           "ST": "Magdeburg.", "SH": "Kiel.", "TH": "Erfurt."}
VOTE_18 = {"BY", "HE", "SN"}
COLORS = {"blau": "blue", "weiß": "white", "rot": "red", "schwarz": "black", "gold": "gold",
          "grün": "green", "gelb": "yellow"}
PLACE_EN = {"Köln.": "Cologne.", "München.": "Munich.", "Nürnberg.": "Nuremberg.", "Hannover.": "Hanover.",
            "Frankfurt/Oder.": "Frankfurt (Oder).", "München": "Munich", "Frankfurt": "Frankfurt",
            "Sachsen": "Saxony", "Bayern": "Bavaria", "Thüringen": "Thuringia", "Hessen": "Hesse",
            "Saarland": "Saarland", "Brandenburg": "Brandenburg"}
OPT_EN = {
    "beim Ordnungsamt der Gemeinde": "at the municipal public order office",
    "bei der Verbraucherzentrale": "at the consumer advice centre",
    "bei der Landeszentrale für politische Bildung": "at the State Agency for Civic Education",
    "bei den Kirchen": "at the churches",
    "beim / bei der Landesbeauftragten für politische Bildung": "at the State Commissioner for Civic Education",
    "Erste Ministerin/Erster Minister": "First Minister",
    "Premierministerin/Premierminister": "Prime Minister",
    "Bürgermeisterin/Bürgermeister": "Mayor",
    "Ministerpräsidentin/Ministerpräsident": "Minister-President",
    "Oberbürgermeisterin/Oberbürgermeister": "Lord Mayor (Oberbürgermeister)",
    "Präsidentin/Präsident des Senates": "President of the Senate",
    "Regierende Bürgermeisterin/Regierender Bürgermeister": "Governing Mayor",
    "Erste Bürgermeisterin/Erster Bürgermeister": "First Mayor",
    "Regierende Senatorin/Regierender Senator": "Governing Senator",
    "Finanzministerin/Finanzminister": "Minister of Finance",
    "Justizministerin/Justizminister": "Minister of Justice",
    "Innenministerin/Innenminister": "Minister of the Interior",
    "Außenministerin/Außenminister": "Foreign Minister",
    "Finanzsenatorin/Finanzsenator": "Senator for Finance",
    "Innensenatorin/Innensenator": "Senator for the Interior",
    "Justizsenatorin/Justizsenator": "Senator for Justice",
    "Senatorin/Senator für Außenbeziehungen": "Senator for External Relations",
}


def opt_en(o):
    if o in OPT_EN:
        return OPT_EN[o]
    if o in PLACE_EN:
        return PLACE_EN[o]
    if re.fullmatch(r"[a-zäöüß]+(-[a-zäöüß]+)+", o):
        return "-".join(COLORS[c] for c in o.split("-"))
    return o  # numbers, place names


def state_q(q):
    s, n, de, opts = q["state"], q["num"], q["question"], q["options"]
    name = STATE_EN[s]
    who = STATE_FULL_EN.get(s, f"the federal state of {name}")
    if n == 1:
        return COAT[s], f"Which coat of arms belongs to {who}?"
    if n == 2:
        kind = "a borough (Bezirk) of" if "Bezirk" in de else "a district (Stadtteil) of" if "Stadtteil" in de else "a district (Landkreis) in"
        return opts.index(DISTRICT[s]) + 1, f"Which is {kind} {name}?"
    if n == 3:
        body = "state parliament (Landtag)" if "Landtag" in de else "state parliament"
        return opts.index("4" if s == "HB" else "5") + 1, f"For how many years is the {body} of {name} elected?"
    if n == 4:
        if s == "HB":
            en_q = "From what age may you vote in elections to the Bremen Bürgerschaft (state parliament)?"
        elif s in ("BE", "HH"):
            en_q = f"From what age may you vote in municipal elections in {name} (election of the district assemblies)?"
        else:
            en_q = f"From what age may you vote in municipal elections in {name}?"
        return opts.index("18" if s in VOTE_18 else "16") + 1, en_q
    if n == 5:
        return 2, f"What colours does the state flag of {name} have?"
    if n == 6:
        i = next(i for i, o in enumerate(opts) if "Landeszentrale" in o or "Landesbeauftragten" in o)
        return i + 1, f"Where can you find information about political topics in {name}?"
    if n == 7:
        if "Stadtstaat" in de:
            en_q = "What is a German city state?" if de.startswith("Was") else "Which federal state is a city state?"
            return 1, en_q
        return opts.index(CAPITAL[s]) + 1, f"The state capital of {name} is …"
    if n == 8:
        return MAP[s], f"Which federal state is {name}?"
    if n == 9:
        want = {"BE": "Regierender Bürgermeister", "HB": "Präsident des Senates", "HH": "Erster Bürgermeister"}.get(s, "Ministerpräsident")
        i = next(i for i, o in enumerate(opts) if want in o)
        return i + 1, f"What is the head of government of {name} called?"
    if n == 10:
        i = next(i for i, o in enumerate(opts) if "Außen" in o)
        kind = "senator" if "Senator" in de else "minister"
        return i + 1, f"Which {kind} does {name} not have?"
    raise ValueError(q["id"])


base, tr_en = [], {}
for q in qs:
    qid = q["id"]
    de_q = FIX_Q.get(qid, q["question"])
    opts = q["options"]
    if q["state"]:
        ans, en_q = state_q(q)
        en_opts = [opt_en(o) for o in opts]
    else:
        row = en[qid]
        ans, en_q = row[0], row[1]
        en_opts = row[2:] if len(row) > 2 else None
    if opts[0] == "Bild 1":
        en_opts = [f"Image {i}" for i in range(1, 5)]
    elif opts == ["1", "2", "3", "4"]:
        en_opts = list(opts)
    assert en_opts and len(en_opts) == 4, qid
    assert 1 <= ans <= 4, qid
    item = {"id": qid, "n": q["num"], "s": q["state"], "q": de_q, "o": opts, "a": ans - 1}
    if q.get("image"):
        item["img"] = q["image"].removesuffix(".png")
    base.append(item)
    tr_en[qid] = {"q": en_q, "o": en_opts}

os.makedirs(os.path.join(out_dir, "translations"), exist_ok=True)
json.dump(base, open(os.path.join(out_dir, "questions.de.json"), "w"), ensure_ascii=False, separators=(",", ":"))
json.dump(tr_en, open(os.path.join(out_dir, "translations", "en.json"), "w"), ensure_ascii=False, separators=(",", ":"))

# images + a static require() map (Metro needs literal require paths)
img_out = os.path.join(out_dir, "..", "..", "assets", "questions")
os.makedirs(img_out, exist_ok=True)
lines = ["// Generated by build_data.py — do not edit.", "export const questionImages: Record<string, { src: number; ratio: number }> = {"]
for item in base:
    if "img" in item:
        im = Image.open(os.path.join(img_dir, item["img"] + ".png")).convert("RGB")
        if im.width > 720:
            im = im.resize((720, round(im.height * 720 / im.width)), Image.LANCZOS)
        im.save(os.path.join(img_out, item["img"] + ".jpg"), quality=82, optimize=True, progressive=True)
        lines.append(f'  "{item["img"]}": {{ src: require("@/assets/questions/{item["img"]}.jpg"), ratio: {im.width / im.height:.3f} }},')
lines.append("};\n")
open(os.path.join(out_dir, "images.ts"), "w").write("\n".join(lines))

print(len(base), "questions;", len(tr_en), "en translations")
