"""Generate the Bürgerweg app icons from simple vector shapes.

  python make_icons.py sheet <out.png>                      # comparison sheet of all variants
  python make_icons.py build <variant> <assets/images dir>  # write every PNG Expo needs

Needs pymupdf + pillow. MuPDF's SVG renderer ignores clip paths and dash arrays, so rounding and
cut-outs are done with Pillow masks instead.
"""
import math
import sys

import pymupdf
from PIL import Image, ImageDraw, ImageFont

# Palette (matches src/lib/theme.ts)
SAGE = '#5E9686'
SAGE_LIGHT = '#6CA494'
SAGE_DARK = '#3E7062'
SAGE_MID = '#4A8273'
SAND = '#E8C987'
SAND_DARK = '#B8913F'
CREAM = '#F7F3EA'
INK = '#1F2A2E'


def bezier(p0, p1, p2, p3, t):
    u = 1 - t
    return tuple(u**3 * a + 3 * u * u * t * b + 3 * u * t * t * c + t**3 * d for a, b, c, d in zip(p0, p1, p2, p3))


def road(p0, p1, p2, p3, w0, w1, color, power=1.4):
    """Tapered road along a cubic Bézier: half width w0 at the start, w1 at the end."""
    n = 60
    pts = [bezier(p0, p1, p2, p3, i / n) for i in range(n + 1)]
    left, right = [], []
    for i, (x, y) in enumerate(pts):
        a, b = pts[max(i - 1, 0)], pts[min(i + 1, n)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        length = math.hypot(dx, dy) or 1
        nx, ny = -dy / length, dx / length
        w = (w0 - w1) * (1 - i / n) ** power + w1
        left.append((x + nx * w, y + ny * w))
        right.append((x - nx * w, y - ny * w))
    d = 'M ' + ' L '.join(f'{x:.1f} {y:.1f}' for x, y in left + right[::-1]) + ' Z'
    return f'<path d="{d}" fill="{color}"/>'


def leaf(x, y, size, angle, fill, vein):
    s = size / 250
    return (
        f'<g transform="translate({x} {y}) rotate({angle}) scale({s})">'
        f'<path d="M 0 0 C -78 -40 -88 -160 0 -250 C 88 -160 78 -40 0 0 Z" fill="{fill}"/>'
        f'<path d="M 0 -10 L 0 -200" stroke="{vein}" stroke-width="12" stroke-linecap="round"/></g>'
    )


SUNRISE_ROAD = ((470, 1300), (380, 960), (770, 830), (540, 640))


def v_sunrise():
    return ''.join([
        f'<rect width="1024" height="1024" fill="{SAGE}"/>',
        f'<circle cx="512" cy="560" r="420" fill="{SAGE_LIGHT}"/>',
        f'<circle cx="540" cy="520" r="170" fill="{SAND}"/>',
        f'<ellipse cx="180" cy="860" rx="620" ry="250" fill="{SAGE_MID}"/>',
        f'<ellipse cx="620" cy="1120" rx="760" ry="480" fill="{SAGE_DARK}"/>',
        road(*SUNRISE_ROAD, 150, 5, CREAM),
    ])


def v_evening():
    return ''.join([
        '<rect width="1024" height="1024" fill="#20372F"/>',
        '<circle cx="512" cy="560" r="420" fill="#284339"/>',
        f'<circle cx="540" cy="500" r="150" fill="{SAND}"/>',
        f'<circle cx="250" cy="250" r="10" fill="{CREAM}"/>',
        f'<circle cx="790" cy="300" r="7" fill="{CREAM}"/>',
        f'<circle cx="700" cy="170" r="9" fill="{CREAM}"/>',
        '<ellipse cx="180" cy="860" rx="620" ry="250" fill="#2F5146"/>',
        '<ellipse cx="620" cy="1120" rx="760" ry="480" fill="#3E7062"/>',
        road(*SUNRISE_ROAD, 150, 5, SAND),
    ])


def v_sprout():
    return ''.join([
        f'<rect width="1024" height="1024" fill="{CREAM}"/>',
        road((512, 1200), (300, 900), (760, 760), (512, 560), 170, 22, SAGE),
        f'<rect x="500" y="420" width="24" height="150" rx="12" fill="{SAGE_DARK}"/>',
        leaf(512, 470, 230, -48, SAGE_LIGHT, SAGE_DARK),
        leaf(512, 450, 260, 42, SAND, SAND_DARK),
    ])


def v_stripes():
    return ''.join([
        f'<rect width="1024" height="1024" fill="{CREAM}"/>',
        '<rect y="0" width="1024" height="342" fill="#3A3F3C"/>',
        '<rect y="342" width="1024" height="342" fill="#C46A57"/>',
        f'<rect y="684" width="1024" height="340" fill="{SAND}"/>',
        road((560, 1180), (240, 860), (820, 560), (470, 150), 190, 10, CREAM),
    ])


def v_letter():
    b = (
        'M 360 250 L 560 250 C 700 250 740 330 740 380 C 740 440 700 490 640 500 '
        'C 720 510 770 570 770 650 C 770 720 720 800 580 800 L 360 800 Z'
    )
    return ''.join([
        f'<rect width="1024" height="1024" fill="{SAGE}"/>',
        f'<path d="{b}" fill="{CREAM}"/>',
        road((470, 860), (360, 700), (640, 640), (470, 470), 46, 8, SAGE),
        leaf(700, 330, 170, 35, SAND, SAND_DARK),
    ])


def v_check():
    dots = ''.join(
        f'<circle cx="{x}" cy="{y}" r="{r}" fill="{CREAM}" opacity="{o}"/>'
        for x, y, r, o in [(260, 860, 30, 0.55), (330, 760, 34, 0.7), (420, 680, 38, 0.85)]
    )
    return ''.join([
        f'<rect width="1024" height="1024" fill="{SAGE}"/>',
        f'<circle cx="512" cy="470" r="330" fill="{SAGE_LIGHT}"/>',
        dots,
        f'<path d="M 340 470 L 470 600 L 720 330" fill="none" stroke="{SAND}" stroke-width="96" stroke-linecap="round" stroke-linejoin="round"/>',
    ])


def flag_sunrise(black, red, gold, glow=None):
    """Sunrise path with a German-flag sky: black at the top, red toward the horizon, a gold sun."""
    def f():
        parts = [
            f'<rect width="1024" height="1024" fill="{black}"/>',
            f'<rect y="300" width="1024" height="724" fill="{red}"/>',
        ]
        if glow:
            parts.append(f'<circle cx="540" cy="520" r="250" fill="{glow}"/>')
        parts += [
            f'<circle cx="540" cy="520" r="170" fill="{gold}"/>',
            f'<ellipse cx="180" cy="860" rx="620" ry="250" fill="{SAGE_MID}"/>',
            f'<ellipse cx="620" cy="1120" rx="760" ry="480" fill="{SAGE_DARK}"/>',
            road(*SUNRISE_ROAD, 150, 5, CREAM),
        ]
        return ''.join(parts)
    return f


def flag_sunrise_round(halo_cx, halo_cy, halo_rx, halo_ry):
    """G2 colors with option A's rounded sky: a red halo (circle/dome) rises out of the black sky."""
    def f():
        return ''.join([
            '<rect width="1024" height="1024" fill="#2A2D2B"/>',
            f'<ellipse cx="{halo_cx}" cy="{halo_cy}" rx="{halo_rx}" ry="{halo_ry}" fill="#C2463B"/>',
            '<circle cx="540" cy="520" r="250" fill="#CC5A45"/>',
            '<circle cx="540" cy="520" r="170" fill="#EDC14A"/>',
            f'<ellipse cx="180" cy="860" rx="620" ry="250" fill="{SAGE_MID}"/>',
            f'<ellipse cx="620" cy="1120" rx="760" ry="480" fill="{SAGE_DARK}"/>',
            road(*SUNRISE_ROAD, 150, 5, CREAM),
        ])
    return f


# ---- Styles with soft gradients / layered shadows (composited with Pillow) -------------------------
# A variant may return a dict: {'bg': fn(size) -> RGBA image, 'layers': [(svg_body, cast_shadow), ...]}.

FLAG_BLACK, FLAG_RED, FLAG_GOLD = '#2A2D2B', '#C2463B', '#EDC14A'


def hex_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def mix(stops, t):
    for (p0, c0), (p1, c1) in zip(stops, stops[1:]):
        if t <= p1:
            k = 0 if p1 == p0 else (t - p0) / (p1 - p0)
            a, b = hex_rgb(c0), hex_rgb(c1)
            return tuple(round(x + (y - x) * k) for x, y in zip(a, b))
    return hex_rgb(stops[-1][1])


def vgrad(stops):
    def f(size):
        col = Image.new('RGB', (1, 256))
        for y in range(256):
            col.putpixel((0, y), mix(stops, y / 255))
        return col.resize((size, size), Image.BICUBIC).convert('RGBA')
    return f


def rgrad(cx, cy, radius, stops):
    """Radial gradient; centre and radius in 1024-space."""
    def f(size):
        n = 256
        ramp = Image.new('RGB', (n, 1))
        for i in range(n):
            ramp.putpixel((i, 0), mix(stops, i / (n - 1)))
        img = Image.new('RGB', (size, size))
        s = size / 1024
        px = img.load()
        rp = ramp.load()
        for y in range(size):
            for x in range(size):
                d = math.hypot(x - cx * s, y - cy * s) / (radius * s)
                px[x, y] = rp[min(n - 1, int(d * (n - 1))), 0]
        return img.convert('RGBA')
    return f


def wave(y_left, c1, c2, y_right, color):
    """Rolling hill: smooth top edge from left to right, filled to the bottom."""
    return (f'<path d="M -20 {y_left} C {c1[0]} {c1[1]}, {c2[0]} {c2[1]}, 1044 {y_right} '
            f'L 1044 1044 L -20 1044 Z" fill="{color}"/>')


def v_gradient_sky():
    return {
        'bg': vgrad([(0, FLAG_BLACK), (0.22, '#3A2F2C'), (0.42, '#9C3A31'), (0.56, FLAG_RED), (0.66, '#DB7A4E')]),
        'layers': [(''.join([
            f'<circle cx="540" cy="560" r="230" fill="#E9A65A" opacity="0.35"/>',
            f'<circle cx="540" cy="560" r="160" fill="{FLAG_GOLD}"/>',
            f'<ellipse cx="180" cy="880" rx="620" ry="250" fill="{SAGE_MID}"/>',
            f'<ellipse cx="620" cy="1140" rx="760" ry="480" fill="{SAGE_DARK}"/>',
            road((470, 1300), (380, 980), (770, 850), (540, 670), 150, 5, CREAM),
        ]), False)],
    }


def v_radial_dawn():
    return {
        'bg': rgrad(540, 600, 760, [(0, '#F3D27A'), (0.2, FLAG_GOLD), (0.36, '#D7643F'), (0.55, FLAG_RED), (0.8, '#5A2E2A'), (1, FLAG_BLACK)]),
        'layers': [(''.join([
            f'<ellipse cx="180" cy="880" rx="620" ry="250" fill="{SAGE_MID}"/>',
            f'<ellipse cx="620" cy="1140" rx="760" ry="480" fill="{SAGE_DARK}"/>',
            road((470, 1300), (380, 980), (770, 850), (540, 670), 150, 5, CREAM),
        ]), False)],
    }


def radial_dawn(stops, radius=760, hill_mid=SAGE_MID, hill=SAGE_DARK, road_color=CREAM):
    """S2 family: the sun as a glow fading out through red into a dark sky."""
    def f():
        return {
            'bg': rgrad(540, 600, radius, stops),
            'layers': [(''.join([
                f'<ellipse cx="180" cy="880" rx="620" ry="250" fill="{hill_mid}"/>',
                f'<ellipse cx="620" cy="1140" rx="760" ry="480" fill="{hill}"/>',
                road((470, 1300), (380, 980), (770, 850), (540, 670), 150, 5, road_color),
            ]), False)],
        }
    return f


# Muted flag colors from S2b
M_BLACK, M_RED, M_GOLD = '#4A4544', '#C27A6C', '#EDCB86'
DAWN_HILLS = ('#5E9686', '#4A8273')
DAWN_ROAD = ((470, 1300), (380, 980), (770, 850), (540, 670))


def wavy_band(x0, x1, top, bottom, amp, length, phase, color, opacity=1.0):
    """Band between two sine-wave edges (y = base + amp*sin) from x0 to x1."""
    n = 48
    xs = [x0 + (x1 - x0) * i / n for i in range(n + 1)]
    wave_y = lambda base, x: base + amp * math.sin(2 * math.pi * (x - x0) / length + phase)
    pts = [(x, wave_y(top, x)) for x in xs] + [(x, wave_y(bottom, x)) for x in reversed(xs)]
    d = 'M ' + ' L '.join(f'{x:.1f} {y:.1f}' for x, y in pts) + ' Z'
    return f'<path d="{d}" fill="{color}" opacity="{opacity}"/>'


def dawn_land():
    return ''.join([
        f'<ellipse cx="180" cy="880" rx="620" ry="250" fill="{DAWN_HILLS[0]}"/>',
        f'<ellipse cx="620" cy="1140" rx="760" ry="480" fill="{DAWN_HILLS[1]}"/>',
        road(*DAWN_ROAD, 150, 5, CREAM),
    ])


def blurred_svg(body, radius_ratio):
    """Background made from SVG shapes, softly blurred so color edges melt together."""
    from PIL import ImageFilter

    def f(size):
        return render(svg(body), size).filter(ImageFilter.GaussianBlur(size * radius_ratio))
    return f


def flag_sky_bands():
    # The whole sky is the flag, waving gently.
    return ''.join([
        f'<rect width="1024" height="1024" fill="{M_GOLD}"/>',
        wavy_band(-40, 1064, -80, 270, 34, 760, 0.6, M_BLACK),
        wavy_band(-40, 1064, 270, 520, 34, 760, 0.6, M_RED),
    ])


def v_wave_sky():
    return {'layers': [(flag_sky_bands(), False), (dawn_land(), False)]}


def v_wave_sky_soft():
    return {'bg': blurred_svg(flag_sky_bands(), 0.03), 'layers': [(dawn_land(), False)]}


def v_wave_pole():
    # A flag flying on a pole at the end of the road, in a calm muted sky.
    x0, x1, top, h = 556, 880, 250, 230
    folds = ''.join(
        wavy_band(x0 + i * 81, x0 + (i + 1) * 81, top - 30, top + h + 30, 16, 324, 0.9, c, 0.13)
        for i, c in enumerate(['#FFFFFF', '#000000', '#FFFFFF', '#000000'])
    )
    flag = ''.join([
        wavy_band(x0, x1, top, top + h / 3, 16, 324, 0.9, M_BLACK),
        wavy_band(x0, x1, top + h / 3, top + 2 * h / 3, 16, 324, 0.9, M_RED),
        wavy_band(x0, x1, top + 2 * h / 3, top + h, 16, 324, 0.9, M_GOLD),
    ])
    return {
        'bg': vgrad([(0, '#C9D9D3'), (0.55, '#EADFCB'), (1, '#F1E2C8')]),
        'layers': [
            (flag, True),
            (f'<rect x="536" y="226" width="20" height="470" rx="10" fill="{M_BLACK}"/>'
             f'<circle cx="546" cy="226" r="18" fill="{M_GOLD}"/>', False),
            (dawn_land(), False),
        ],
    }


def rolling_flag_sky(shadows, red_edge, gold_edge, top_sky=None):
    """Flag in the sky as S3-style rolling waves (black, red, gold), above S2b's green hills and road."""
    def f():
        layers = []
        if top_sky:
            layers.append((f'<rect width="1024" height="1024" fill="{top_sky}"/>', False))
            layers.append((wave(170, (260, 90), (640, 250), 200, M_BLACK), shadows))
        else:
            layers.append((f'<rect width="1024" height="1024" fill="{M_BLACK}"/>', False))
        layers += [
            (wave(*red_edge, M_RED), shadows),
            (wave(*gold_edge, M_GOLD), shadows),
            (dawn_land(), shadows),
        ]
        return {'layers': layers}
    return f


def round_flag_steps(red, gold):
    """X2 with round steps: red and gold are domes (ellipses: cx, cy, rx, ry) stacked like hills."""
    def f():
        return {'layers': [
            (f'<rect width="1024" height="1024" fill="{M_BLACK}"/>', False),
            (f'<ellipse cx="{red[0]}" cy="{red[1]}" rx="{red[2]}" ry="{red[3]}" fill="{M_RED}"/>', True),
            (f'<ellipse cx="{gold[0]}" cy="{gold[1]}" rx="{gold[2]}" ry="{gold[3]}" fill="{M_GOLD}"/>', True),
            (dawn_land(), True),
        ]}
    return f


FLAG_HILL_ROAD = ((560, 1250), (300, 980), (760, 820), (470, 560))


def flag_hills(shadows, sky):
    def f():
        return {
            'bg': sky,
            'layers': [
                (f'<circle cx="720" cy="300" r="120" fill="{CREAM}"/>', False),
                (wave(470, (240, 380), (600, 560), 520, FLAG_BLACK), shadows),
                (wave(640, (300, 560), (700, 720), 600, FLAG_RED), shadows),
                (wave(800, (380, 700), (720, 860), 760, FLAG_GOLD), shadows),
                (road(*FLAG_HILL_ROAD, 150, 6, SAGE_DARK), False),
            ],
        }
    return f


def v_line_art():
    stroke = 'fill="none" stroke-linecap="round" stroke-linejoin="round"'
    return ''.join([
        f'<rect width="1024" height="1024" fill="{CREAM}"/>',
        f'<circle cx="540" cy="430" r="150" fill="{FLAG_GOLD}"/>',
        f'<path d="M 120 600 C 320 470, 520 520, 900 560" stroke="{FLAG_BLACK}" stroke-width="44" {stroke}/>',
        f'<path d="M 120 720 C 380 600, 640 690, 900 660" stroke="{FLAG_RED}" stroke-width="44" {stroke}/>',
        f'<path d="M 420 900 C 400 780, 620 760, 540 610" stroke="{SAGE_DARK}" stroke-width="40" {stroke}/>',
        f'<path d="M 640 900 C 640 800, 700 760, 580 610" stroke="{SAGE_DARK}" stroke-width="40" {stroke}/>',
    ])


VARIANTS = {
    'A': ('Sunrise path', v_sunrise),
    'B': ('Evening path', v_evening),
    'C': ('Path & sprout', v_sprout),
    'D': ('Soft German stripes', v_stripes),
    'E': ('Letter B with leaf', v_letter),
    'F': ('Path to the check', v_check),
    'G1': ('Flag sky, classic', flag_sunrise('#1E1E1E', '#D02B26', '#F5C400')),
    'G2': ('Flag sky, softened', flag_sunrise('#2A2D2B', '#C2463B', '#EDC14A', glow='#CC5A45')),
    'H1': ('Round halo (like A)', flag_sunrise_round(512, 560, 420, 420)),
    'H2': ('Wide dome', flag_sunrise_round(512, 760, 720, 520)),
    'H3': ('Full-width arc', flag_sunrise_round(512, 1000, 980, 760)),
    'G3': ('Flag sky, warm dusk', flag_sunrise('#262321', '#A9352E', '#F0B93A', glow='#B84838')),
    'S1': ('Gradient sunrise', v_gradient_sky),
    'S2': ('Radiant dawn', v_radial_dawn),
    'S2a': ('Soft dawn', radial_dawn(
        [(0, '#F6DFA0'), (0.24, '#EFC768'), (0.42, '#DE8A62'), (0.62, '#C9675A'), (0.85, '#7A4A45'), (1, '#4A3C3A')],
        radius=820)),
    'S2b': ('Muted dawn', radial_dawn(
        [(0, '#F7E6B8'), (0.26, '#EDCB86'), (0.46, '#DE9C7C'), (0.68, '#C27A6C'), (0.9, '#80625C'), (1, '#5C5250')],
        radius=880, hill_mid='#5E9686', hill='#4A8273')),
    'S2c': ('Pastel dawn', radial_dawn(
        [(0, '#FAEECB'), (0.28, '#F2D9A0'), (0.5, '#E8B396'), (0.72, '#D39486'), (0.92, '#9C8580'), (1, '#7C7472')],
        radius=940, hill_mid='#6CA494', hill='#5E9686')),
    'W1': ('Waving flag sky', v_wave_sky),
    'W2': ('Blended flag sky', v_wave_sky_soft),
    'W3': ('Flag on the hill', v_wave_pole),
    'X1': ('Rolling flag sky', rolling_flag_sky(False, (270, (260, 170), (640, 380), 320), (470, (330, 380), (700, 560), 440))),
    'X2': ('Rolling flag, paper cut', rolling_flag_sky(True, (270, (260, 170), (640, 380), 320), (470, (330, 380), (700, 560), 440))),
    'X3': ('Rolling flag + pale sky', rolling_flag_sky(True, (350, (260, 250), (640, 440), 390), (520, (330, 440), (700, 600), 500), top_sky='#DCE6E1')),
    'Y1': ('Round domes', round_flag_steps((512, 1000, 920, 740), (512, 1100, 860, 650))),
    'Y2': ('Offset round hills', round_flag_steps((300, 860, 820, 600), (740, 1000, 780, 560))),
    'Y3': ('Rainbow arcs', round_flag_steps((512, 1100, 860, 860), (512, 1100, 660, 660))),
    'S3': ('Flag hills', flag_hills(False, vgrad([(0, '#8FC0B2'), (1, '#D9E8E2')]))),
    'S4': ('Flag hills, paper cut', flag_hills(True, vgrad([(0, '#8FC0B2'), (1, '#D9E8E2')]))),
    'S5': ('Flag hills at dawn', flag_hills(True, vgrad([(0, '#6E8F86'), (0.6, '#E9C9A0'), (1, '#F4E3C5')]))),
    'S6': ('Line art', v_line_art),
}


def svg(body, pad=0):
    """pad > 0 widens the view on every side (in artwork units), so the artwork shrinks toward the center."""
    v = 1024 + 2 * pad
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{v}" height="{v}" viewBox="{-pad} {-pad} {v} {v}">{body}</svg>'


def render(svg_text, size):
    page = pymupdf.open(stream=svg_text.encode(), filetype='svg')[0]
    z = size / page.rect.width
    pix = page.get_pixmap(matrix=pymupdf.Matrix(z, z), alpha=True)
    return Image.frombytes('RGBA', (pix.width, pix.height), pix.samples)


def icon_image(key, size, pad=0):
    """Render a variant to an RGBA image: optional gradient background, then layers with soft shadows.

    With pad, the scene is drawn smaller in the middle and continues outward (Android adaptive icons)."""
    from PIL import ImageFilter

    spec = VARIANTS[key][1]()
    if isinstance(spec, str):
        return render(svg(spec, pad), size)
    img = spec['bg'](size) if spec.get('bg') else Image.new('RGBA', (size, size), (0, 0, 0, 0))
    for body, shadow in spec['layers']:
        if pad and body.startswith('<rect width="1024" height="1024"'):
            body = body.replace('<rect width="1024" height="1024"', f'<rect x="{-pad}" y="{-pad}" width="{1024 + 2 * pad}" height="{1024 + 2 * pad}"', 1)
        layer = render(svg(body, pad), size)
        if shadow:
            alpha = layer.getchannel('A').point(lambda v: v * 0.38)
            sh = Image.new('RGBA', layer.size, (20, 18, 16, 0))
            sh.putalpha(alpha)
            sh = sh.transform(sh.size, Image.AFFINE, (1, 0, 0, 0, 1, -size * 0.014)).filter(ImageFilter.GaussianBlur(size * 0.018))
            img = Image.alpha_composite(img, sh)
        img = Image.alpha_composite(img, layer)
    return img


def rounded(img, ratio=230 / 1024):
    size, k = img.width, 4
    mask = Image.new('L', (size * k, size * k), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size * k - 1, size * k - 1), radius=size * k * ratio, fill=255)
    out = img.copy()
    out.putalpha(mask.resize((size, size), Image.LANCZOS))
    return out


def font(size):
    for path in ('/System/Library/Fonts/Helvetica.ttc', '/System/Library/Fonts/SFNS.ttf'):
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            pass
    return ImageFont.load_default()


def sheet(out, keys=None):
    keys = keys or list(VARIANTS)
    cols, cell_w, cell_h = 3, 420, 400
    rows = (len(keys) + cols - 1) // cols
    img = Image.new('RGB', (cols * cell_w, rows * cell_h + 80), '#F5F3EE')
    d = ImageDraw.Draw(img)
    d.text((30, 24), 'Bürgerweg icon options  (large · home screen · browser tab)', fill=INK, font=font(28))
    for i, key in enumerate(keys):
        name, fn = VARIANTS[key]
        x, y = (i % cols) * cell_w + 30, (i // cols) * cell_h + 84
        icon = icon_image(key, 512)
        big = rounded(icon.resize((280, 280), Image.LANCZOS))
        img.paste(big, (x, y), big)
        mid = rounded(icon.resize((64, 64), Image.LANCZOS))
        img.paste(mid, (x + 300, y + 20), mid)
        tab = rounded(icon.resize((32, 32), Image.LANCZOS), 0.18)
        img.paste(tab, (x + 316, y + 110), tab)
        d.text((x, y + 296), f'{key}  {name}', fill=INK, font=font(30))
    img.save(out)


def build(key, out):
    big = icon_image(key, 1024)
    big.save(f'{out}/icon.png')
    rounded(big.resize((512, 512), Image.LANCZOS)).save(f'{out}/splash-icon.png')
    rounded(big.resize((256, 256), Image.LANCZOS)).resize((64, 64), Image.LANCZOS).save(f'{out}/favicon.png')
    # Android adaptive: the layer is 108dp but launchers show only the middle 72dp (masked), so the
    # artwork is drawn at 2/3 size with the scene continuing outward. Transparent foreground.
    icon_image(key, 432, pad=256).save(f'{out}/android-icon-background.png')
    Image.new('RGBA', (512, 512), (0, 0, 0, 0)).save(f'{out}/android-icon-foreground.png')
    # Monochrome themed icon: light parts of the design become the silhouette.
    gray = icon_image(key, 432, pad=256).convert('L')
    mono = Image.new('RGBA', gray.size, (0, 0, 0, 0))
    mono.putalpha(gray.point(lambda v: 255 if v > 170 else 0))
    mono.save(f'{out}/android-icon-monochrome.png')

    # PWA / web app icons (public/ is copied to the web export root).
    import os
    pwa = os.path.join(out, '..', '..', 'public', 'icons')
    os.makedirs(pwa, exist_ok=True)
    for size in (192, 512):
        rounded(big.resize((size, size), Image.LANCZOS)).save(f'{pwa}/icon-{size}.png')
    big.resize((512, 512), Image.LANCZOS).save(f'{pwa}/maskable-512.png')  # full bleed; launchers crop it
    big.convert('RGB').resize((180, 180), Image.LANCZOS).save(f'{pwa}/apple-touch-icon.png')  # iOS rounds it


if __name__ == '__main__':
    if sys.argv[1] == 'sheet':
        sheet(sys.argv[2], sys.argv[3:] or None)
    else:
        build(sys.argv[2], sys.argv[3])
