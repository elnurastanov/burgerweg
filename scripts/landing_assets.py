"""Generate landing-page images (needs pillow + pymupdf; run from the repo root).

  python scripts/landing_assets.py

Inputs:  scripts/shots/{de,en}-{home,exam,flashcards,transfer}.jpg  (750×1624 app screenshots)
         assets/icon-src/make_icons.py                               (icon artwork, variant Y3)
Outputs: landing/images/*.webp, hero.svg, og-de.png, og-en.png; landing/favicon.ico, landing/icon-*.png
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'assets', 'icon-src'))
import make_icons as icons  # noqa: E402

OUT = os.path.join(ROOT, 'landing', 'images')
SHOTS = os.path.join(ROOT, 'scripts', 'shots')
os.makedirs(OUT, exist_ok=True)

BG = (245, 243, 238)
INK = (31, 42, 46)
MUTED = (107, 122, 127)


def font(size, bold=False):
    for path in (
        '/System/Library/Fonts/Supplemental/Arial Bold.ttf' if bold else '/System/Library/Fonts/Supplemental/Arial.ttf',
        '/System/Library/Fonts/Helvetica.ttc',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    ):
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            pass
    return ImageFont.load_default()


def phone(shot, width):
    """Screenshot in a soft rounded phone frame with a gentle shadow (RGBA)."""
    img = Image.open(shot).convert('RGB')
    h = round(img.height * width / img.width)
    img = img.resize((width, h), Image.LANCZOS)
    pad, border = round(width * 0.05), round(width * 0.025)
    frame = Image.new('RGBA', (width + 2 * border, h + 2 * border), (0, 0, 0, 0))
    ImageDraw.Draw(frame).rounded_rectangle((0, 0, frame.width - 1, frame.height - 1), radius=round(width * 0.11), fill=(38, 36, 35, 255))
    mask = Image.new('L', (width, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, width - 1, h - 1), radius=round(width * 0.09), fill=255)
    frame.paste(img, (border, border), mask)
    canvas = Image.new('RGBA', (frame.width + 2 * pad, frame.height + 2 * pad), (0, 0, 0, 0))
    shadow = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((pad, pad + 8, pad + frame.width, pad + frame.height + 8), radius=round(width * 0.11), fill=(31, 42, 46, 60))
    canvas = Image.alpha_composite(canvas, shadow.filter(ImageFilter.GaussianBlur(pad * 0.45)))
    canvas.alpha_composite(frame, (pad, pad))
    return canvas


def screenshots():
    for lang in ('de', 'en'):
        for name in ('home', 'exam', 'flashcards', 'transfer'):
            src = os.path.join(SHOTS, f'{lang}-{name}.jpg')
            phone(src, 420).save(os.path.join(OUT, f'{lang}-{name}.webp'), quality=82, method=6)


def hero_svg():
    """Y3 artwork as a crisp SVG for the hero (browser shadows via CSS filter instead of Pillow)."""
    spec = icons.VARIANTS['Y3'][1]()
    body = ''.join(
        f'<g filter="url(#s)">{layer}</g>' if shadow else layer for layer, shadow in spec['layers']
    )
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" role="img" '
        'aria-label="Ein Weg über grüne Hügel unter Bögen in Schwarz, Rot und Gold">'
        '<defs><clipPath id="c"><rect width="1024" height="1024" rx="230"/></clipPath>'
        '<filter id="s" x="-10%" y="-10%" width="120%" height="120%">'
        '<feDropShadow dx="0" dy="-14" stdDeviation="16" flood-color="#141210" flood-opacity="0.35"/></filter></defs>'
        f'<g clip-path="url(#c)">{body}</g></svg>'
    )
    open(os.path.join(OUT, 'hero.svg'), 'w').write(svg)


def og_image(lang):
    title = {'de': 'Bürgerweg', 'en': 'Bürgerweg'}[lang]
    lines = {
        'de': ['Ruhig zum bestandenen', 'Einbürgerungstest'],
        'en': ['Calm preparation for the', 'German citizenship test'],
    }[lang]
    sub = {'de': 'Kostenlos · ohne Konto · offline', 'en': 'Free · no account · works offline'}[lang]
    img = Image.new('RGBA', (1200, 630), BG + (255,))
    art = icons.rounded(icons.icon_image('Y3', 300))
    img.alpha_composite(art, (90, 165))
    d = ImageDraw.Draw(img)
    d.text((450, 170), title, fill=INK, font=font(72, bold=True))
    d.text((450, 270), lines[0], fill=INK, font=font(44))
    d.text((450, 325), lines[1], fill=INK, font=font(44))
    d.text((450, 405), sub, fill=MUTED, font=font(32))
    shot = phone(os.path.join(SHOTS, f'{lang}-home.jpg'), 190)
    img.alpha_composite(shot, (1200 - shot.width + 10, 630 - 420))
    img.convert('RGB').save(os.path.join(OUT, f'og-{lang}.png'), optimize=True)


def favicons():
    art = icons.icon_image('Y3', 512)
    landing = os.path.join(ROOT, 'landing')
    icons.rounded(art.resize((256, 256), Image.LANCZOS)).save(os.path.join(landing, 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48)])
    icons.rounded(art.resize((192, 192), Image.LANCZOS)).save(os.path.join(landing, 'icon-192.png'))
    art.convert('RGB').resize((180, 180), Image.LANCZOS).save(os.path.join(landing, 'apple-touch-icon.png'))


if __name__ == '__main__':
    os.chdir(os.path.join(ROOT, 'assets', 'icon-src'))
    screenshots()
    hero_svg()
    og_image('de')
    og_image('en')
    favicons()
    print('landing assets written to landing/ and landing/images/')
