"""
Generate a high-fidelity PNG preview of the CGP Immo Analytics landing page.
Uses Pillow to render a pixel-accurate mockup of the dark-mode design.
"""

from PIL import Image, ImageDraw, ImageFont
import os

# ============================================================
# CONFIG
# ============================================================
W = 1440  # Width
SECTION_PAD = 80
BG = (11, 17, 32)          # #0B1120
BG_SURFACE = (19, 24, 37)  # #131825
TEXT_PRIMARY = (241, 245, 249)    # #F1F5F9
TEXT_SECONDARY = (148, 163, 184)  # #94A3B8
TEXT_TERTIARY = (71, 85, 105)     # #475569
ACCENT = (37, 99, 235)           # #2563EB
SUCCESS = (16, 185, 129)         # #10B981
DANGER = (239, 68, 68)           # #EF4444
COMPLIANCE = (99, 102, 241)      # #6366F1
GOLD = (201, 168, 76)            # #C9A84C
BORDER = (255, 255, 255, 15)     # rgba(255,255,255,0.06)
CARD_BG = (19, 24, 37, 153)     # rgba(19,24,37,0.6)
WHITE_10 = (255, 255, 255, 26)

# Try to load fonts
def get_font(size, bold=False):
    """Try system fonts, fallback to default."""
    names = [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    ]
    for name in names:
        if os.path.exists(name):
            return ImageFont.truetype(name, size)
    return ImageFont.load_default()

def get_mono_font(size):
    names = [
        '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf',
    ]
    for name in names:
        if os.path.exists(name):
            return ImageFont.truetype(name, size)
    return ImageFont.load_default()

# Fonts
f_hero = get_font(52, bold=True)
f_h2 = get_font(36, bold=True)
f_h3 = get_font(20, bold=True)
f_body = get_font(16)
f_body_sm = get_font(14)
f_small = get_font(12)
f_tiny = get_font(11)
f_label = get_font(12, bold=True)
f_mono_lg = get_mono_font(36)
f_mono = get_mono_font(14)
f_mono_sm = get_mono_font(12)
f_nav = get_font(14)
f_nav_bold = get_font(14, bold=True)
f_btn = get_font(15, bold=True)

# ============================================================
# HELPERS
# ============================================================

def draw_rounded_rect(draw, xy, fill, radius=12, border=None):
    x0, y0, x1, y1 = xy
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=border)

def draw_pill(draw, xy, fill, text, font, text_color):
    x0, y0, x1, y1 = xy
    draw.rounded_rectangle(xy, radius=(y1-y0)//2, fill=fill)
    tw = draw.textlength(text, font=font)
    tx = x0 + ((x1-x0) - tw) / 2
    ty = y0 + ((y1-y0) - font.size) / 2 - 2
    draw.text((tx, ty), text, fill=text_color, font=font)

def center_text(draw, y, text, font, fill, width=W):
    tw = draw.textlength(text, font=font)
    draw.text(((width - tw) / 2, y), text, fill=fill, font=font)

def draw_glass_card(draw, xy, radius=12):
    x0, y0, x1, y1 = xy
    draw.rounded_rectangle(xy, radius=radius, fill=(19, 24, 37))
    draw.rounded_rectangle(xy, radius=radius, outline=(255, 255, 255, 15))

# ============================================================
# BUILD IMAGE
# ============================================================

# Pre-calculate total height
y = 0
heights = {
    'navbar': 64,
    'hero': 700,
    'metrics': 120,
    'features': 600,
    'funds': 580,
    'howitworks': 400,
    'testimonials': 380,
    'compliance': 420,
    'pricing': 600,
    'resources': 350,
    'cta': 280,
    'footer': 300,
}
total_h = sum(heights.values())

img = Image.new('RGB', (W, total_h), BG)
draw = ImageDraw.Draw(img, 'RGBA')

LEFT = 80
RIGHT = W - 80
CONTENT_W = RIGHT - LEFT
CX = W // 2

y_pos = 0

# ============================================================
# 1. NAVBAR
# ============================================================
draw.rectangle([0, y_pos, W, y_pos + 64], fill=(11, 17, 32, 204))
# Logo
draw.rounded_rectangle([LEFT, y_pos+16, LEFT+32, y_pos+48], radius=6, fill=ACCENT)
draw.text((LEFT+8, y_pos+22), "IA", fill=(255,255,255), font=get_mono_font(12))
draw.text((LEFT+42, y_pos+22), "CGP Immo Analytics", fill=TEXT_PRIMARY, font=f_nav_bold)
# Green dot + status
dot_x = LEFT + 230
draw.ellipse([dot_x, y_pos+28, dot_x+8, y_pos+36], fill=SUCCESS)
draw.text((dot_x+12, y_pos+24), "Données à jour", fill=SUCCESS, font=f_small)
# Nav links
nav_links = ["Plateforme", "Fonds analysés", "Méthodologie", "Tarifs", "Ressources"]
nx = CX - 200
for link in nav_links:
    draw.text((nx, y_pos+24), link, fill=TEXT_SECONDARY, font=f_nav)
    nx += draw.textlength(link, font=f_nav) + 32
# Buttons
draw.rounded_rectangle([RIGHT-250, y_pos+18, RIGHT-140, y_pos+46], radius=6, outline=TEXT_TERTIARY)
draw.text((RIGHT-235, y_pos+24), "Se connecter", fill=TEXT_PRIMARY, font=f_body_sm)
draw.rounded_rectangle([RIGHT-130, y_pos+18, RIGHT, y_pos+46], radius=6, fill=ACCENT)
draw.text((RIGHT-112, y_pos+24), "Essai gratuit", fill=(255,255,255), font=f_body_sm)

# Border bottom
draw.line([0, y_pos+63, W, y_pos+63], fill=(255,255,255,15), width=1)
y_pos += heights['navbar']

# ============================================================
# 2. HERO
# ============================================================
hero_start = y_pos
# Dot grid (subtle)
for gx in range(0, W, 24):
    for gy in range(y_pos, y_pos + heights['hero'], 24):
        draw.ellipse([gx, gy, gx+1, gy+1], fill=(255,255,255,8))

# Radial glow
for r in range(300, 0, -1):
    alpha = int(20 * (1 - r/300))
    cx, cy = CX, y_pos + 300
    draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=(37, 99, 235, alpha))

# Badge
badge_text = "Propulsé par l'Intelligence Artificielle"
btw = draw.textlength(badge_text, font=f_body_sm)
bx = CX - btw/2 - 16
draw_pill(draw, (bx, y_pos+120, bx+btw+32, y_pos+148), (37, 99, 235, 25), badge_text, f_body_sm, COMPLIANCE)

# Headline
line1 = "L'analyse de fonds immobiliers,"
line2 = "réinventée par l'IA"
center_text(draw, y_pos + 180, line1, f_hero, TEXT_PRIMARY)
center_text(draw, y_pos + 240, line2, f_hero, ACCENT)

# Subtitle
sub1 = "Analysez, comparez et sélectionnez les meilleurs fonds immobiliers pour vos clients."
sub2 = "Données en temps réel, scoring IA propriétaire, conformité DDA intégrée."
center_text(draw, y_pos + 320, sub1, f_body, TEXT_SECONDARY)
center_text(draw, y_pos + 345, sub2, f_body, TEXT_SECONDARY)

# CTA buttons
btn1_text = "Accéder à la plateforme"
btn1_w = draw.textlength(btn1_text, font=f_btn) + 48
btn1_x = CX - btn1_w/2 - 80
draw.rounded_rectangle([btn1_x, y_pos+400, btn1_x+btn1_w, y_pos+440], radius=8, fill=ACCENT)
draw.text((btn1_x+24, y_pos+410), btn1_text, fill=(255,255,255), font=f_btn)
# Glow
for r in range(40, 0, -1):
    a = int(5 * (1 - r/40))
    draw.rounded_rectangle([btn1_x-r, y_pos+400-r, btn1_x+btn1_w+r, y_pos+440+r], radius=8+r, outline=(37, 99, 235, a))

btn2_text = "▶  Voir une démo"
btn2_w = draw.textlength(btn2_text, font=f_btn) + 48
btn2_x = CX + btn1_w/2 - 50
draw.rounded_rectangle([btn2_x, y_pos+400, btn2_x+btn2_w, y_pos+440], radius=8, outline=TEXT_TERTIARY)
draw.text((btn2_x+24, y_pos+410), btn2_text, fill=TEXT_PRIMARY, font=f_btn)

# Trust line
trust_text = "Sans engagement · Gratuit pour les étudiants CGP · Données AMF vérifiées"
center_text(draw, y_pos + 470, trust_text, f_small, TEXT_TERTIARY)

# Trust bar
draw.line([LEFT+200, y_pos+520, RIGHT-200, y_pos+520], fill=(255,255,255,15), width=1)
center_text(draw, y_pos + 540, "DONNÉES ISSUES DE SOURCES RÉGLEMENTÉES", f_label, TEXT_TERTIARY)
orgs = "AMF    |    ORIAS    |    ANACOFI    |    CNCEF    |    ASPIM"
center_text(draw, y_pos + 570, orgs, f_body_sm, (71, 85, 105, 128))

y_pos += heights['hero']

# ============================================================
# 3. METRICS BAR
# ============================================================
draw.rectangle([0, y_pos, W, y_pos + heights['metrics']], fill=BG_SURFACE)
draw.line([0, y_pos, W, y_pos], fill=(255,255,255,15), width=1)
draw.line([0, y_pos+heights['metrics']-1, W, y_pos+heights['metrics']-1], fill=(255,255,255,15), width=1)

metrics = [
    ("850+", "FONDS ANALYSÉS"),
    ("75 Md€", "CAPITALISATION COUVERTE"),
    ("2 500+", "CGP UTILISATEURS"),
    ("24/7", "MISE À JOUR CONTINUE"),
    ("97,3%", "SATISFACTION"),
]
mx_start = LEFT + 20
mx_step = CONTENT_W // 5
for i, (val, label) in enumerate(metrics):
    mx = mx_start + i * mx_step + mx_step // 2
    vw = draw.textlength(val, font=f_mono_lg)
    draw.text((mx - vw/2, y_pos + 25), val, fill=TEXT_PRIMARY, font=f_mono_lg)
    lw = draw.textlength(label, font=f_label)
    draw.text((mx - lw/2, y_pos + 75), label, fill=TEXT_TERTIARY, font=f_label)

y_pos += heights['metrics']

# ============================================================
# 4. FEATURES (Bento Grid)
# ============================================================
center_text(draw, y_pos + 40, "PLATEFORME", f_label, ACCENT)
center_text(draw, y_pos + 65, "Tous les outils pour un conseil éclairé", f_h2, TEXT_PRIMARY)

features = [
    ("◎  Scoring IA propriétaire", "Chaque SCPI, OPCI et SCI reçoit un score de 0 à 100\ncalculé par notre algorithme sur 47 critères."),
    ("⟺  Comparateur multi-fonds", "Comparez jusqu'à 5 fonds côte à côte\nsur tous les indicateurs clés."),
    ("✓  Données réglementaires", "Rapports annuels, bulletins trimestriels,\ndonnées AMF centralisées."),
    ("⊞  Simulateur patrimonial", "Simulez l'impact fiscal, le rendement net\net la plus-value potentielle."),
    ("⊡  Conformité DDA / MIF2", "Rapports d'adéquation et fiches produit\nconformes générés automatiquement."),
    ("◈  Alertes et veille", "Notifications en temps réel des\nchangements de prix et événements."),
]

# Large card (0) spans 2 cols
card_y = y_pos + 130
card_gap = 12
col_w = (CONTENT_W - card_gap * 2) // 3

# Card 0: large (2 cols, 2 rows)
big_w = col_w * 2 + card_gap
big_h = 270 + card_gap + 120
draw_glass_card(draw, (LEFT, card_y, LEFT + big_w, card_y + big_h))
draw.rounded_rectangle([LEFT+24, card_y+24, LEFT+60, card_y+60], radius=8, fill=(37, 99, 235, 25))
draw.text((LEFT+30, card_y+30), "◎", fill=ACCENT, font=f_h3)
draw.text((LEFT+24, card_y+76), features[0][0].split("  ")[1], fill=TEXT_PRIMARY, font=get_font(24, bold=True))
draw.text((LEFT+24, card_y+112), features[0][1], fill=TEXT_SECONDARY, font=f_body)

# Score pills in big card
pills = [("91/100", (37, 99, 235, 38), (96, 165, 250)), ("78/100", (16, 185, 129, 38), (52, 211, 153)),
         ("54/100", (234, 179, 8, 38), (250, 204, 21)), ("28/100", (239, 68, 68, 38), (248, 113, 113))]
px = LEFT + 24
for text, bg, fg in pills:
    pw = draw.textlength(text, font=f_mono_sm) + 24
    draw_pill(draw, (px, card_y+170, px+pw, card_y+196), bg, text, f_mono_sm, fg)
    px += pw + 12

# Cards 1-5
small_cards = features[1:]
positions = [
    (LEFT + big_w + card_gap, card_y, LEFT + big_w + card_gap + col_w, card_y + 190),
    (LEFT + big_w + card_gap, card_y + 190 + card_gap, LEFT + big_w + card_gap + col_w, card_y + big_h),
    (LEFT, card_y + big_h + card_gap, LEFT + col_w, card_y + big_h + card_gap + 150),
    (LEFT + col_w + card_gap, card_y + big_h + card_gap, LEFT + col_w*2 + card_gap, card_y + big_h + card_gap + 150),
    (LEFT + col_w*2 + card_gap*2, card_y + big_h + card_gap, RIGHT, card_y + big_h + card_gap + 150),
]

for i, (title, desc) in enumerate(small_cards):
    if i >= len(positions):
        break
    x0, y0, x1, y1 = positions[i]
    draw_glass_card(draw, (x0, y0, x1, y1))
    icon = title.split("  ")[0]
    name = title.split("  ")[1] if "  " in title else title
    draw.rounded_rectangle([x0+20, y0+20, x0+48, y0+48], radius=6, fill=(37, 99, 235, 25))
    draw.text((x0+28, y0+24), icon, fill=ACCENT, font=f_body_sm)
    draw.text((x0+20, y0+60), name, fill=TEXT_PRIMARY, font=f_h3)
    # Multi-line desc
    for j, line in enumerate(desc.split('\n')):
        draw.text((x0+20, y0+90+j*20), line, fill=TEXT_SECONDARY, font=f_body_sm)

y_pos += heights['features']

# ============================================================
# 5. FUND SHOWCASE
# ============================================================
draw.rectangle([0, y_pos, W, y_pos + heights['funds']], fill=BG_SURFACE)
center_text(draw, y_pos + 40, "DONNÉES EN TEMPS RÉEL", f_label, ACCENT)
center_text(draw, y_pos + 65, "Suivez la performance de +850 fonds immobiliers", f_h2, TEXT_PRIMARY)

# Table
table_y = y_pos + 130
table_x = LEFT
draw_glass_card(draw, (LEFT, table_y, RIGHT, table_y + 350))

# Header
headers = ["Fonds", "Type", "TD 2024", "TOF", "Capitalisation", "Score IA"]
col_widths = [250, 100, 150, 120, 180, 150]
hx = table_x + 20
for i, h in enumerate(headers):
    draw.text((hx, table_y + 20), h, fill=TEXT_TERTIARY, font=f_label)
    hx += col_widths[i]
draw.line([table_x+20, table_y+48, RIGHT-20, table_y+48], fill=(255,255,255,15), width=1)

# Rows
funds = [
    ("Iroko Zen", "SCPI", "7.12%  ▲", "98.2%", "462 M€", "91/100", "excellent"),
    ("Remake Live", "SCPI", "7.79%  ▲", "99.5%", "835 M€", "89/100", "excellent"),
    ("Corum Origin", "SCPI", "6.26%  ▲", "97.6%", "2.8 Md€", "87/100", "excellent"),
    ("Novaxia Neo", "SCPI", "6.51%  ▲", "97.1%", "415 M€", "85/100", "excellent"),
    ("Transitions Europe", "SCPI", "8.16%  ▲", "99.0%", "198 M€", "84/100", "good"),
]

for row_i, (name, ftype, td, tof, cap, score, score_class) in enumerate(funds):
    ry = table_y + 60 + row_i * 52
    # Hover effect for first row
    if row_i == 0:
        draw.rectangle([table_x+2, ry-4, RIGHT-2, ry+44], fill=(26, 32, 53))

    rx = table_x + 20
    draw.text((rx, ry+10), name, fill=TEXT_PRIMARY, font=f_nav_bold)
    rx += col_widths[0]

    draw_pill(draw, (rx, ry+8, rx+50, ry+30), (37, 99, 235, 25), ftype, f_mono_sm, ACCENT)
    rx += col_widths[1]

    draw.text((rx, ry+10), td, fill=SUCCESS, font=f_mono)
    rx += col_widths[2]

    draw.text((rx, ry+10), tof, fill=TEXT_SECONDARY, font=f_mono)
    rx += col_widths[3]

    draw.text((rx, ry+10), cap, fill=TEXT_SECONDARY, font=f_mono)
    rx += col_widths[4]

    sc_bg = (37, 99, 235, 38) if score_class == "excellent" else (16, 185, 129, 38)
    sc_fg = (96, 165, 250) if score_class == "excellent" else (52, 211, 153)
    sw = draw.textlength(score, font=f_mono_sm) + 24
    draw_pill(draw, (rx, ry+6, rx+sw, ry+32), sc_bg, score, f_mono_sm, sc_fg)

    if row_i < len(funds) - 1:
        draw.line([table_x+20, ry+48, RIGHT-20, ry+48], fill=(255,255,255,10), width=1)

# Disclaimer
draw.text((LEFT, table_y+370), "Les performances passées ne préjugent pas des performances futures. Données au 31/12/2024.", fill=TEXT_TERTIARY, font=f_tiny)
exp_text = "Explorer tous les fonds →"
ew = draw.textlength(exp_text, font=f_nav_bold)
draw.text((RIGHT-ew, table_y+370), exp_text, fill=ACCENT, font=f_nav_bold)

y_pos += heights['funds']

# ============================================================
# 6. HOW IT WORKS
# ============================================================
center_text(draw, y_pos + 50, "Comment ça marche", f_h2, TEXT_PRIMARY)

steps = [
    ("01", "Recherchez", "Accédez à notre base de données\ncomplète de SCPI, OPCI et SCI."),
    ("02", "Analysez", "Notre IA évalue chaque fonds\nsur 47 critères."),
    ("03", "Recommandez", "Générez des fiches conformes DDA\net partagez avec vos clients."),
]

sx_start = LEFT + 50
sx_step = CONTENT_W // 3
for i, (num, title, desc) in enumerate(steps):
    sx = sx_start + i * sx_step
    draw.text((sx, y_pos + 130), num, fill=(37, 99, 235, 50), font=get_mono_font(48))
    draw.text((sx, y_pos + 200), title, fill=TEXT_PRIMARY, font=f_h3)
    for j, line in enumerate(desc.split('\n')):
        draw.text((sx, y_pos + 235 + j*22), line, fill=TEXT_SECONDARY, font=f_body_sm)

# Connecting line
draw.line([LEFT+150, y_pos+165, RIGHT-150, y_pos+165], fill=(37, 99, 235, 30), width=1)

y_pos += heights['howitworks']

# ============================================================
# 7. TESTIMONIALS
# ============================================================
draw.rectangle([0, y_pos, W, y_pos + heights['testimonials']], fill=BG_SURFACE)
center_text(draw, y_pos + 40, "La confiance de milliers de conseillers", f_h2, TEXT_PRIMARY)

testimonials = [
    ('"Cet outil a transformé ma pratique.\nJe gagne 3 heures par semaine\nsur mes analyses."', "Marie D.", "CGPI indépendante, Paris"),
    ('"Le scoring IA est bluffant de\nprécision. Mon outil de référence\npour la sélection de SCPI."', "Thomas R.", "Dir. associé, Cabinet GP, Lyon"),
    ('"Enfin un outil pensé pour les\nCGP français. La conformité DDA\nintégrée, c\'est indispensable."', "Sophie L.", "CIF, Bordeaux"),
]

tw = (CONTENT_W - 2 * card_gap) // 3
for i, (quote, name, title) in enumerate(testimonials):
    tx = LEFT + i * (tw + card_gap)
    ty = y_pos + 110
    draw_glass_card(draw, (tx, ty, tx + tw, ty + 220))
    draw.text((tx+24, ty+16), "\u201C", fill=(37, 99, 235, 50), font=get_font(36, bold=True))
    for j, line in enumerate(quote.replace('\u201C', '').replace('\u201D', '').split('\n')):
        draw.text((tx+24, ty+60+j*20), line, fill=TEXT_SECONDARY, font=f_body_sm)
    draw.text((tx+24, ty+165), name, fill=TEXT_PRIMARY, font=f_nav_bold)
    draw.text((tx+24, ty+185), title, fill=TEXT_TERTIARY, font=f_small)

y_pos += heights['testimonials']

# ============================================================
# 8. COMPLIANCE
# ============================================================
center_text(draw, y_pos + 40, "Sécurité et conformité réglementaire", f_h2, TEXT_PRIMARY)
center_text(draw, y_pos + 85, "Conçu pour répondre aux exigences les plus strictes du conseil en gestion de patrimoine", f_body, TEXT_SECONDARY)

compliance_items = [
    ("AMF", "Données issues de sources régulées par\nl'Autorité des Marchés Financiers"),
    ("ORIAS", "Compatible avec les obligations\nd'enregistrement ORIAS"),
    ("DDA / MIF2", "Rapports d'adéquation conformes\nà la Directive Distribution d'Assurances"),
    ("RGPD", "Protection des données conforme\nau Règlement Général (RGPD)"),
    ("Hébergement FR", "Données hébergées en France\n(infrastructure souveraine)"),
    ("Chiffrement", "Chiffrement AES-256\nen transit et au repos"),
]

cw = (CONTENT_W - 2 * card_gap) // 3
for i, (title, desc) in enumerate(compliance_items):
    col = i % 3
    row = i // 3
    cx0 = LEFT + col * (cw + card_gap)
    cy0 = y_pos + 140 + row * (110 + card_gap)
    draw_glass_card(draw, (cx0, cy0, cx0 + cw, cy0 + 110))
    draw.text((cx0+24, cy0+18), title, fill=TEXT_PRIMARY, font=f_nav_bold)
    for j, line in enumerate(desc.split('\n')):
        draw.text((cx0+24, cy0+42+j*18), line, fill=TEXT_SECONDARY, font=f_small)

y_pos += heights['compliance']

# ============================================================
# 9. PRICING
# ============================================================
draw.rectangle([0, y_pos, W, y_pos + heights['pricing']], fill=BG_SURFACE)
center_text(draw, y_pos + 40, "Des tarifs adaptés à votre activité", f_h2, TEXT_PRIMARY)

# Toggle
toggle_y = y_pos + 90
toggle_x = CX - 80
draw.text((toggle_x, toggle_y), "Mensuel", fill=TEXT_PRIMARY, font=f_body_sm)
draw.rounded_rectangle([toggle_x+75, toggle_y-2, toggle_x+123, toggle_y+22], radius=12, fill=(255,255,255,25))
draw.ellipse([toggle_x+78, toggle_y+1, toggle_y+1+18-(toggle_y-toggle_y), toggle_y+19], fill=(255,255,255))
draw.ellipse([toggle_x+78, toggle_y+1, toggle_x+96, toggle_y+19], fill=(255,255,255))
draw.text((toggle_x+135, toggle_y), "Annuel", fill=TEXT_TERTIARY, font=f_body_sm)
draw.text((toggle_x+185, toggle_y+2), "-20%", fill=SUCCESS, font=f_small)

# Cards
plans = [
    ("Découverte", "Gratuit", "", ["Accès limité à 50 fonds", "Scoring IA basique", "Données publiques AMF"], False),
    ("Professionnel", "99€", "/mois HT", ["Accès illimité tous fonds", "Scoring IA avancé (47 critères)", "Comparateur multi-fonds", "Export PDF analyses", "Conformité DDA intégrée", "Support prioritaire"], True),
    ("Cabinet", "Sur devis", "", ["Tout Professionnel +", "Multi-utilisateurs", "API d'intégration", "Marque blanche", "Accompagnement dédié"], False),
]

pw = (CONTENT_W - 2 * card_gap) // 3
for i, (name, price, period, features, highlighted) in enumerate(plans):
    px0 = LEFT + i * (pw + card_gap)
    py0 = y_pos + 140
    py1 = py0 + 400

    if highlighted:
        # Gradient border glow
        for r in range(6, 0, -1):
            draw.rounded_rectangle([px0-r, py0-r, px0+pw+r, py1+r], radius=12+r, outline=(37, 99, 235, int(25*(6-r)/6)))
        draw.rounded_rectangle([px0, py0, px0+pw, py1], radius=12, fill=(19, 24, 37), outline=ACCENT)
        # Badge
        draw_pill(draw, (px0+20, py0+16, px0+100, py0+38), ACCENT, "Populaire", f_small, (255,255,255))
        name_y = py0 + 50
    else:
        draw_glass_card(draw, (px0, py0, px0+pw, py1))
        name_y = py0 + 24

    draw.text((px0+24, name_y), name, fill=TEXT_PRIMARY, font=f_h3)
    draw.text((px0+24, name_y+30), price, fill=TEXT_PRIMARY, font=get_mono_font(32))
    if period:
        pw_text = draw.textlength(price, font=get_mono_font(32))
        draw.text((px0+24+pw_text+4, name_y+42), period, fill=TEXT_TERTIARY, font=f_body_sm)

    for j, feat in enumerate(features):
        fy = name_y + 85 + j * 28
        draw.text((px0+24, fy), "✓", fill=SUCCESS, font=f_body_sm)
        draw.text((px0+44, fy), feat, fill=TEXT_SECONDARY, font=f_body_sm)

    # CTA button
    btn_y = py1 - 56
    if highlighted:
        draw.rounded_rectangle([px0+20, btn_y, px0+pw-20, btn_y+40], radius=8, fill=ACCENT)
        bt = "Essai gratuit 14 jours"
        btw2 = draw.textlength(bt, font=f_btn)
        draw.text((px0 + pw/2 - btw2/2, btn_y+10), bt, fill=(255,255,255), font=f_btn)
    else:
        draw.rounded_rectangle([px0+20, btn_y, px0+pw-20, btn_y+40], radius=8, outline=TEXT_TERTIARY)
        bt = "Commencer" if i == 0 else "Contacter"
        btw2 = draw.textlength(bt, font=f_btn)
        draw.text((px0 + pw/2 - btw2/2, btn_y+10), bt, fill=TEXT_PRIMARY, font=f_btn)

y_pos += heights['pricing']

# ============================================================
# 10. RESOURCES
# ============================================================
center_text(draw, y_pos + 40, "Ressources pour les CGP", f_h2, TEXT_PRIMARY)

articles = [
    ("GUIDE", "Comment sélectionner une SCPI\npour vos clients en 2025", "12 min de lecture"),
    ("ANALYSE", "OPCI vs SCPI : analyse\ncomparative complète", "8 min de lecture"),
    ("CONFORMITÉ", "Les obligations DDA du CGP :\nchecklist pratique", "6 min de lecture"),
]

aw = (CONTENT_W - 2 * card_gap) // 3
for i, (cat, title, time) in enumerate(articles):
    ax = LEFT + i * (aw + card_gap)
    ay = y_pos + 110
    draw_glass_card(draw, (ax, ay, ax + aw, ay + 170))
    draw.text((ax+24, ay+20), cat, fill=ACCENT, font=f_label)
    for j, line in enumerate(title.split('\n')):
        draw.text((ax+24, ay+50+j*22), line, fill=TEXT_PRIMARY, font=f_nav_bold)
    draw.text((ax+24, ay+130), time, fill=TEXT_TERTIARY, font=f_small)

center_text(draw, y_pos + 310, "Voir toutes les ressources →", f_nav_bold, ACCENT)

y_pos += heights['resources']

# ============================================================
# 11. FINAL CTA
# ============================================================
draw.rectangle([0, y_pos, W, y_pos + heights['cta']], fill=BG_SURFACE)
# Glow
for r in range(200, 0, -1):
    a = int(12 * (1 - r/200))
    draw.ellipse([CX-r, y_pos+140-r, CX+r, y_pos+140+r], fill=(37, 99, 235, a))

center_text(draw, y_pos + 60, "Prêt à transformer votre conseil patrimonial ?", f_h2, TEXT_PRIMARY)
center_text(draw, y_pos + 110, "Rejoignez les CGP qui ont déjà adopté l'analyse augmentée par l'IA.", f_body, TEXT_SECONDARY)

cta_text = "Créer mon compte gratuitement"
cta_w = draw.textlength(cta_text, font=f_btn) + 48
cta_x = CX - cta_w/2
draw.rounded_rectangle([cta_x, y_pos+160, cta_x+cta_w, y_pos+200], radius=8, fill=ACCENT)
draw.text((cta_x+24, y_pos+170), cta_text, fill=(255,255,255), font=f_btn)
center_text(draw, y_pos + 220, "Sans carte bancaire · Résiliation à tout moment · Support français", f_small, TEXT_TERTIARY)

y_pos += heights['cta']

# ============================================================
# 12. FOOTER
# ============================================================
draw.line([0, y_pos, W, y_pos], fill=(255,255,255,15), width=1)

footer_cols = [
    ("Plateforme", ["Analyse SCPI", "Analyse OPCI", "Analyse SCI", "Comparateur", "Simulateur"]),
    ("Ressources", ["Blog", "Guides CGP", "Webinaires", "FAQ", "Documentation API"]),
    ("Entreprise", ["À propos", "Équipe", "Carrières", "Presse", "Contact"]),
    ("Légal", ["Mentions légales", "Confidentialité", "CGU", "Cookies", "RGPD"]),
]

fcw = CONTENT_W // 4
for i, (title, links) in enumerate(footer_cols):
    fx = LEFT + i * fcw
    draw.text((fx, y_pos + 30), title, fill=TEXT_PRIMARY, font=f_nav_bold)
    for j, link in enumerate(links):
        draw.text((fx, y_pos + 60 + j * 24), link, fill=TEXT_TERTIARY, font=f_body_sm)

# Bottom bar
draw.line([LEFT, y_pos + 220, RIGHT, y_pos + 220], fill=(255,255,255,15), width=1)
draw.text((LEFT, y_pos + 240), "© 2025 CGP Immo Analytics · Tous droits réservés", fill=TEXT_TERTIARY, font=f_tiny)
center_text(draw, y_pos + 240, "Société enregistrée au RCS de Paris", f_tiny, TEXT_TERTIARY)
draw.text((RIGHT-120, y_pos + 240), "LinkedIn  ·  Twitter/X", fill=TEXT_TERTIARY, font=f_tiny)

# Legal disclaimer
disclaimer = "Les informations présentées ne constituent pas un conseil en investissement. Les performances passées ne préjugent pas des performances futures."
center_text(draw, y_pos + 270, disclaimer, f_tiny, (71, 85, 105, 100))

# ============================================================
# SAVE
# ============================================================
output_path = '/home/user/re/output/landing-page-preview.png'
img.save(output_path, 'PNG', optimize=True)
print(f"✓ Preview saved: {output_path}")
print(f"  Dimensions: {img.size[0]}x{img.size[1]}px")
