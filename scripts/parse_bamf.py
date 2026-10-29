"""Parse the BAMF Gesamtfragenkatalog PDF into questions JSON + cropped question images."""
import json
import os
import re
import sys

import pymupdf

pdf_path, out_json, img_dir = sys.argv[1:4]
os.makedirs(img_dir, exist_ok=True)

STATES = {
    "Baden-Württemberg": "BW", "Bayern": "BY", "Berlin": "BE", "Brandenburg": "BB",
    "Bremen": "HB", "Hamburg": "HH", "Hessen": "HE", "Mecklenburg-Vorpommern": "MV",
    "Niedersachsen": "NI", "Nordrhein-Westfalen": "NW", "Rheinland-Pfalz": "RP",
    "Saarland": "SL", "Sachsen": "SN", "Sachsen-Anhalt": "ST", "Schleswig-Holstein": "SH",
    "Thüringen": "TH",
}

doc = pymupdf.open(pdf_path)
questions = []
state = None
cur = None


def norm(s):
    s = re.sub(r"\s+", " ", s).strip()
    s = s.replace(" …", " …").replace("...", "…")
    return s


def finish():
    if cur is None:
        return
    cur["question"] = norm(" ".join(cur.pop("qlines")))
    cur["question"] = re.sub(r"^\d+\.\s*", "", cur["question"])
    cur["options"] = [norm(" ".join(o)) for o in cur.pop("olines")]
    joined = " ".join(cur["options"])
    if re.fullmatch(r"(Bild \d\s*)+", joined.strip()):
        cur["options"] = [f"Bild {i}" for i in range(1, 5)]
    elif re.fullmatch(r"[1-4\s]+", joined.strip()):
        cur["options"] = [str(i) for i in range(1, 5)]
    regions = cur.pop("regions")
    if regions:
        page_no, rect = regions[0]
        pix = doc[page_no].get_pixmap(dpi=144, clip=rect)
        name = f"{cur['id']}.png"
        pix.save(os.path.join(img_dir, name))
        cur["image"] = name
    cur.pop("_img_bottom", None)
    assert len(cur["options"]) == 4, (cur["id"], cur["options"])
    questions.append(cur)


for pno, page in enumerate(doc):
    cur_at_start = cur
    d = page.get_text("dict")
    lines = []
    imgs = []
    for b in d["blocks"]:
        if b["type"] == 1:
            if b["bbox"][1] > 130:  # skip BAMF logo in header
                imgs.append(pymupdf.Rect(b["bbox"]))
            continue
        for l in b["lines"]:
            spans = l["spans"]
            if not any(s["text"].strip() for s in spans):
                continue
            y0 = min(s["bbox"][1] for s in spans)
            if y0 > 750:  # footer
                continue
            lines.append({
                "y0": y0, "y1": max(s["bbox"][3] for s in spans),
                "x0": min(s["bbox"][0] for s in spans),
                "spans": spans,
            })
    lines.sort(key=lambda l: (round(l["y0"]), l["x0"]))
    # merge spans that share a line (checkbox + text)
    merged = []
    for l in lines:
        if merged and abs(merged[-1]["y0"] - l["y0"]) < 4:
            merged[-1]["spans"] += l["spans"]
            merged[-1]["y1"] = max(merged[-1]["y1"], l["y1"])
        else:
            merged.append(l)

    for l in merged:
        text = "".join(s["text"] for s in l["spans"] if s["font"] != "Wingdings2")
        is_box = any(s["font"] == "Wingdings2" for s in l["spans"]) or text.strip().startswith(("□", "☐"))
        text = text.strip().lstrip("□☐").strip()
        bold = all("Bold" in s["font"] for s in l["spans"] if s["text"].strip())
        t = text.strip()
        m = re.match(r"Fragen für das Bundesland (.+)$", t)
        if m:
            finish(); cur = None
            state = STATES[m.group(1).strip()]
            continue
        if t.startswith("Teil I") and bold:
            continue
        m = re.match(r"Aufgabe (\d+)$", t)
        if m and bold:
            finish()
            n = int(m.group(1))
            cur = {
                "id": f"{state}-{n}" if state else f"g{n}",
                "num": n, "state": state,
                "qlines": [], "olines": [], "regions": [],
                "_y": l["y1"], "_page": pno,
            }
            continue
        if cur is None:
            continue
        if is_box:
            cur["olines"].append([t] if t else [])
        elif cur["olines"] and l["x0"] > 95:
            cur["olines"][-1].append(t)
        elif not cur["olines"] and l["x0"] < 100 and not t.startswith("©") and not re.match(r"Bild \d", t) and "_img_bottom" not in cur:
            cur["qlines"].append(t)
        else:
            pass  # image captions / credits are part of the image crop

    # assign images on this page to the question they sit under
    if cur is not None or questions:
        for r in imgs:
            pass
    # crop: for each question started (or continuing) on this page, union images between its header and its first option
    starts = [(q["_y"] if q.get("_page") == pno else 0, q) for q in ([cur] if cur else [])]

    if imgs:
        # find which question each image belongs to by vertical position relative to "Aufgabe" headers on this page
        heads = [(l["y0"], re.match(r"Aufgabe (\d+)$", "".join(s["text"] for s in l["spans"]).strip())) for l in merged]
        heads = [(y, int(m.group(1))) for y, m in heads if m]
        boxes = [l for l in merged if any(s["font"] == "Wingdings2" or s["text"].strip().startswith(("□", "☐")) for s in l["spans"])]
        groups = {}
        for r in imgs:
            above = [h for h in heads if h[0] < r.y0]
            key = above[-1][1] if above else None
            groups.setdefault(key, []).append(r)
        for key, rs in groups.items():
            u = pymupdf.Rect(rs[0])
            for r in rs[1:]:
                u |= r
            # extend down to include captions/credits until first checkbox below the image
            below = [b["y0"] for b in boxes if b["y0"] > u.y1 - 2]
            bottom = (min(below) - 4) if below else u.y1 + 30
            clip = pymupdf.Rect(60, u.y0 - 6, 540, bottom)
            # the image's question: last question with that num started on/before this page
            if key is None:
                target = cur_at_start
            elif cur and cur["num"] == key:
                target = cur
            else:
                target = next((q for q in reversed(questions) if q["num"] == key and q["state"] == state), None)
            if target is None:
                print("WARN unassigned image on page", pno + 1, file=sys.stderr)
                continue
            if "image" in target:
                print("WARN second image for", target["id"], file=sys.stderr)
                continue
            if target is cur:
                cur["regions"].append((pno, clip))
            else:
                pix = page.get_pixmap(dpi=144, clip=clip)
                name = f"{target['id']}.png"
                pix.save(os.path.join(img_dir, name))
                target["image"] = name

finish()
for q in questions:
    q.pop("_y", None); q.pop("_page", None)
json.dump(questions, open(out_json, "w"), ensure_ascii=False, indent=1)
print(len(questions), "questions;", sum(1 for q in questions if q.get("image")), "with images")
