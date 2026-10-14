#!/usr/bin/env python3
"""Compose the Quillhaven dusk panorama from the building sprites.

Native size is 640 by 256. The page shows the top 224 rows at 2x
(pixelated) and keeps the lower rows as ground for the parallax shift.
Positions below are hand placed on that grid. Light comes from the upper
left, so highlights sit on left edges and shadows fall to the lower right.

The back row is three-quarter scale. The front row is full size. Trees,
lamps, the fountain, and the street props are drawn here in the brand
palette. No prop sprites shipped with the buildings.

    python3 tools/compose-panorama.py
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BUILDINGS = ROOT / "img" / "buildings"
OUT = ROOT / "img" / "quillhaven"

W, H = 640, 256
FRAME = 224

# Front doors share this line. The sidewalk starts here. The Academy
# stands a few pixels higher and its steps stop on this line.
BASE = 188

NAVY = (31, 42, 68)
INK = (20, 28, 48)
GOLD = (184, 134, 11)
CREAM = (250, 246, 234)
BURGUNDY = (122, 46, 46)
CHARCOAL = (43, 43, 43)
GRASS = (47, 74, 52)
GRASS_D = (26, 46, 28)
GRASS_L = (78, 110, 68)
HILL = (36, 58, 42)
HILL_D = (22, 36, 28)
HILL_FAR = (28, 40, 48)
STONE = (214, 198, 164)
STONE_D = (132, 116, 92)
STONE_L = (236, 224, 196)
COBBLE = (74, 66, 56)
COBBLE_L = (118, 104, 82)
COBBLE_D = (42, 38, 34)
COBBLE_W = (146, 128, 102)
MORTAR = (36, 32, 28)
WATER = (42, 72, 104)
WATER_L = (168, 196, 210)
LEAF = (24, 52, 34)
LEAF_L = (58, 96, 58)
LEAF_B = (92, 36, 40)
LEAF_BL = (138, 72, 48)
WOOD = (132, 86, 48)
WOOD_D = (78, 50, 30)
WOOD_L = (176, 132, 76)
PATH = (154, 122, 78)
PATH_D = (108, 84, 54)
GLOW = (176, 128, 48)


def blank():
    return Image.new("RGBA", (W, H), (0, 0, 0, 0))


def set_px(im, x, y, color):
    if 0 <= x < W and 0 <= y < H:
        im.putpixel((x, y), color if len(color) == 4 else (*color, 255))


def fill_rect(im, x, y, w, h, color):
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            set_px(im, xx, yy, color)


def tint(im, x, y, color, amount):
    if not (0 <= x < W and 0 <= y < H):
        return
    r, g, b, a = im.getpixel((x, y))
    if a < 180:
        return
    t = amount / 255
    im.putpixel(
        (x, y),
        (
            int(r * (1 - t) + color[0] * t),
            int(g * (1 - t) + color[1] * t),
            int(b * (1 - t) + color[2] * t),
            a,
        ),
    )


def opaque_box(im):
    px = im.load()
    width, height = im.size
    left = top = right = bottom = None
    for y in range(height):
        for x in range(width):
            if px[x, y][3] > 16:
                if top is None:
                    top = y
                bottom = y
                if left is None or x < left:
                    left = x
                if right is None or x > right:
                    right = x
    return left, top, right, bottom


def shade_light(im):
    """Darken toward the right edge of a sprite. Light is from the left."""
    out = im.copy()
    px = out.load()
    width, height = out.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            factor = 1 - 0.28 * (x / max(1, width - 1))
            px[x, y] = (int(r * factor), int(g * factor), int(b * factor), a)
    return out


def push_navy(im, mix):
    out = im.copy()
    px = out.load()
    width, height = out.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            px[x, y] = (
                int(r * (1 - mix) + NAVY[0] * mix),
                int(g * (1 - mix) + NAVY[1] * mix),
                int(b * (1 - mix) + NAVY[2] * mix),
                a,
            )
    return out


def is_window(r, g, b, a):
    """Gold or amber glass, not timber and not pale stone."""
    if a < 200 or b > 170:
        return False
    if r > 210 and g > 150 and r - b > 70 and g - b > 30:
        return True
    if r > 210 and 110 < g < 190 and b < 90 and r - g > 15:
        return True
    return False


def window_mask(im):
    px = im.load()
    width, height = im.size
    found = []
    for y in range(height):
        for x in range(width):
            if is_window(*px[x, y]):
                found.append((x, y))
    return found


def apply_windows(im, mask):
    """Relight glass after the distance tint. Left panes catch the sun."""
    px = im.load()
    width = im.size[0]
    for x, y in mask:
        r, g, b, a = px[x, y]
        if x < width * 0.62:
            px[x, y] = (255, 214, 120, a)
        else:
            px[x, y] = (186, 124, 42, a)


def scale_three_quarter(im):
    return im.resize((im.width * 3 // 4, im.height * 3 // 4), Image.Resampling.NEAREST)


def load_building(name, scale="full", distant=False):
    im = Image.open(BUILDINGS / name).convert("RGBA")
    if scale == "threeq":
        im = scale_three_quarter(im)
    windows = window_mask(im) if distant else []
    if distant:
        im = push_navy(im, 0.2)
    im = shade_light(im)
    if windows:
        apply_windows(im, windows)
    return im


def paste_foot(layer, im, foot_x, foot_y, label):
    """Put the opaque bottom-center of im on (foot_x, foot_y)."""
    left, top, right, bottom = opaque_box(im)
    origin_x = int(foot_x - (left + right) // 2)
    origin_y = int(foot_y - bottom)
    layer.alpha_composite(im, (origin_x, origin_y))
    span = (origin_x + left, origin_y + top, origin_x + right, origin_y + bottom)
    print(f"  {label:12} foot ({foot_x:3},{foot_y:3}) span x {span[0]:3}-{span[2]:3} y {span[1]:3}-{span[3]:3}")
    return span


def cast_shadow(layer, foot_x, foot_y, radius):
    """A short shadow falling down and to the right of a foot point."""
    px = layer.load()
    for y in range(foot_y - 1, foot_y + 4):
        for x in range(foot_x - radius // 3, foot_x + radius + 6):
            if not (0 <= x < W and 0 <= y < H):
                continue
            along = x - (foot_x - radius // 3)
            if along < 0 or along > radius + radius // 3:
                continue
            r, g, b, a = px[x, y]
            if a < 200:
                continue
            fade = 0.62 + 0.2 * (along / max(1, radius))
            px[x, y] = (int(r * fade), int(g * fade), int(b * fade), a)


def paint_sky(im):
    px = im.load()
    stops = [
        (0, INK),
        (48, NAVY),
        (96, (48, 40, 68)),
        (140, (92, 58, 42)),
        (176, (176, 118, 42)),
        (210, (132, 84, 36)),
        (H - 1, (78, 52, 30)),
    ]
    for y in range(H):
        i = 0
        while i < len(stops) - 2 and y > stops[i + 1][0]:
            i += 1
        y0, c0 = stops[i]
        y1, c1 = stops[i + 1]
        t = 0 if y1 == y0 else (y - y0) / (y1 - y0)
        color = tuple(int(c0[c] + (c1[c] - c0[c]) * t) for c in range(3))
        for x in range(W):
            px[x, y] = (*color, 255)

    stars = (
        (18, 14, CREAM), (46, 28, GOLD), (78, 12, CREAM), (104, 36, GOLD),
        (132, 18, CREAM), (168, 8, GOLD), (196, 30, CREAM), (228, 16, GOLD),
        (258, 40, CREAM), (292, 10, GOLD), (318, 26, CREAM), (352, 14, GOLD),
        (386, 34, CREAM), (414, 8, GOLD), (448, 22, CREAM), (482, 12, GOLD),
        (512, 32, CREAM), (548, 16, GOLD), (578, 8, CREAM), (612, 28, GOLD),
        (30, 48, GOLD), (154, 52, CREAM), (274, 48, GOLD), (430, 46, CREAM),
        (560, 50, GOLD), (96, 22, CREAM), (340, 44, GOLD), (500, 24, CREAM),
    )
    for x, y, color in stars:
        cross = color == CREAM and (x // 20) % 2 == 0
        set_px(im, x, y, color)
        if cross:
            set_px(im, x - 2, y, color)
            set_px(im, x + 2, y, color)
            set_px(im, x, y - 2, color)
            set_px(im, x, y + 2, color)

    # Low sun on the left, above the hill. Right side is the shaded limb.
    for y in range(11):
        for x in range(11):
            dx, dy = x - 5, y - 5
            if dx * dx + dy * dy <= 20:
                color = GOLD if x < 7 else (140, 88, 24)
                if dx * dx + dy * dy <= 6 and x < 6:
                    color = (236, 196, 96)
                set_px(im, 78 + x, 62 + y, color)

    clouds = (
        (92, 28, 1), (210, 18, 1), (330, 40, 0), (455, 22, 1), (575, 36, 0),
    )
    for cx, cy, big in clouds:
        stamp_cloud(im, cx, cy, big)


def stamp_cloud(im, x, y, big):
    blocks = [(0, 4, 8, 3), (2, 1, 10, 3), (1, 7, 8, 2)]
    if big:
        blocks += [(8, 3, 7, 3), (-3, 4, 4, 2)]
    for bx, by, bw, bh in blocks:
        for yy in range(bh):
            for xx in range(bw):
                color = CREAM if xx < 2 else (214, 196, 168) if xx < bw - 2 else (150, 132, 112)
                set_px(im, x + bx + xx, y + by + yy, color)


def near_crest(x):
    return 104 + ((x - 280) * (x - 280)) // 5200


def far_crest(x):
    return 78 + ((x - 180) * (x - 180)) // 9000


def paint_hills(im):
    px = im.load()
    for x in range(W):
        far_y = far_crest(x)
        near_y = near_crest(x)
        for y in range(far_y, H):
            if y < near_y:
                color = (18, 28, 36) if (x % 11 == 0 and y % 5 == 0) else HILL_FAR
            else:
                band = y - near_y
                tuft = x % 17 == 0 and y % 4 == 0 and band < 22
                shade = x % 23 == 0 and y % 5 == 2
                if tuft and x < 360:
                    color = GRASS_L
                elif shade or band >= 22:
                    color = HILL_D
                else:
                    color = HILL
            if y == far_y and (x % 5 == 0):
                continue
            px[x, y] = (*color, 255)


def hill_shelf(im, x0, x1, y):
    """A flat terrace on the hill so the back row shares one path."""
    for x in range(x0, x1):
        set_px(im, x, y, GRASS_L if x % 2 == 0 else GRASS)
        for dy in range(1, 8):
            set_px(im, x, y + dy, HILL if dy < 3 else HILL_D)


def hill_path(im, x0, x1, y):
    for x in range(x0, x1):
        set_px(im, x, y, PATH_D)
        set_px(im, x, y + 1, PATH if x % 4 else PATH_D)
        set_px(im, x, y + 2, PATH_D)


def paint_ground(im):
    px = im.load()
    grass_top = 166
    for y in range(grass_top, BASE):
        for x in range(W):
            ragged = 1 if (x * 3) % 7 == 0 else 0
            if y < grass_top + ragged:
                continue
            if (x * 5 + y * 3) % 17 == 0:
                color = GRASS_L
            elif (x + y) % 11 == 0:
                color = GRASS_D
            else:
                color = GRASS if y < BASE - 6 else GRASS_D
            px[x, y] = (*color, 255)

    paint_sidewalk(im, BASE, BASE + 8)
    paint_curb(px, BASE + 8)
    paint_cobbles(px, BASE + 10, BASE + 28)
    paint_verge(px, BASE + 28, H)
    wear_and_puddles(im)

    for x, y, color in (
        (40, 176, GOLD), (41, 176, GOLD), (64, 180, BURGUNDY),
        (150, 174, GOLD), (210, 178, BURGUNDY), (300, 172, GOLD),
        (455, 176, BURGUNDY), (540, 174, GOLD), (610, 178, BURGUNDY),
    ):
        set_px(im, x, y, color)


def paint_sidewalk(im, y0, y1):
    """Stone slabs. A mortar joint every 11 pixels. Left edge of each slab is lit."""
    for y in range(y0, y1):
        for x in range(W):
            cell = x % 11
            if y == y1 - 1:
                color = STONE_D
            elif cell == 10 or y == y0:
                color = STONE_D if cell == 10 else STONE_L
            elif cell < 2:
                color = STONE_L
            else:
                color = STONE if cell < 7 else STONE_D
            set_px(im, x, y, color)


def paint_curb(px, y):
    for x in range(W):
        px[x, y] = (*STONE_L, 255)
        px[x, y + 1] = (*STONE_D, 255)


def paint_cobbles(px, y0, y1):
    stone_w, stone_h = 7, 4
    for y in range(y0, y1):
        row = (y - y0) // stone_h
        in_row = (y - y0) % stone_h
        shift = 3 if row % 2 else 0
        for x in range(W):
            cell = (x + shift) % (stone_w + 1)
            stone_id = (x + shift) // (stone_w + 1) + row * 5
            if in_row == stone_h - 1 or cell == stone_w:
                color = MORTAR
            elif cell < 2:
                color = COBBLE_L
            elif stone_id % 9 == 0:
                color = COBBLE_W
            elif stone_id % 7 == 0:
                color = COBBLE_D
            else:
                color = COBBLE
            # A chip in the middle of a worn stone.
            if stone_id % 11 == 0 and cell == 3 and in_row == 1:
                color = MORTAR
            px[x, y] = (*color, 255)


def paint_verge(px, y0, y1):
    for y in range(y0, y1):
        for x in range(W):
            if (x * 3 + y) % 13 == 0:
                color = GRASS_L
            elif (x + y) % 9 == 0:
                color = GRASS_D
            else:
                color = GRASS_D if y > y0 + 4 else GRASS
            px[x, y] = (*color, 255)


def wear_and_puddles(im):
    # Highlights sit on the upper-left of each puddle. Light is from that side.
    puddles = ((96, BASE + 16), (214, BASE + 18), (338, BASE + 15), (488, BASE + 17), (590, BASE + 16))
    for x, y in puddles:
        for dx, dy in ((-2, 0), (-1, 0), (0, 0), (1, 0), (2, 0), (-1, 1), (0, 1), (1, 1), (0, -1)):
            color = WATER_L if dx < 1 and dy <= 0 else WATER
            set_px(im, x + dx, y + dy, color)
        set_px(im, x - 1, y - 1, (210, 220, 214))


def plaza(im, x0, x1, y0, y1):
    """Stone court whose front edge is the shared building baseline."""
    for y in range(y0, y1):
        for x in range(x0, x1):
            if y == y1 - 1:
                color = STONE_D
            elif x < x0 + 2 or (x + y) % 9 == 0:
                color = STONE_L
            elif x > (x0 + x1) // 2:
                color = STONE_D
            else:
                color = STONE
            set_px(im, x, y, color)


def academy_steps(im, span):
    """Steps drop from the Academy door and stop on the baseline. They do not enter the street."""
    left, _top, right, bottom = span
    door = (left + right) // 2
    y = bottom
    half = 10
    while y < BASE:
        for x in range(door - half, door + half):
            color = STONE_L if x < door - half + 2 else STONE if y % 2 == 0 else STONE_D
            set_px(im, x, y, color)
        y += 1
        if (y - bottom) % 2 == 0:
            half += 3


def tree(im, x, y, kind):
    """y is the ground line under the trunk. kind is pine, round, or autumn."""
    if kind == "pine":
        rows = (
            (0, -30, 2), (-2, -28, 6), (-3, -26, 8), (-4, -24, 10),
            (-5, -22, 12), (-6, -20, 14), (-5, -18, 12), (-4, -16, 10),
        )
        leaf, leaf_l = LEAF, LEAF_L
        trunk = 14
    elif kind == "autumn":
        rows = (
            (-4, -26, 10), (-6, -24, 14), (-7, -22, 16), (-7, -20, 16),
            (-6, -18, 14), (-4, -16, 10),
        )
        leaf, leaf_l = LEAF_B, LEAF_BL
        trunk = 14
    else:
        rows = (
            (-4, -26, 10), (-6, -24, 14), (-7, -22, 16), (-7, -20, 16),
            (-6, -18, 14), (-4, -16, 10),
        )
        leaf, leaf_l = LEAF, LEAF_L
        trunk = 14
    for lx, ly, lw in rows:
        for i in range(lw):
            color = leaf_l if i < 3 else leaf
            set_px(im, x + lx + i, y + ly, color)
    for i in range(trunk):
        set_px(im, x, y - trunk + i, CHARCOAL)
        set_px(im, x + 1, y - trunk + i, (28, 24, 22))


def bush(im, x, y):
    rows = ((-3, -6, 8), (-4, -4, 10), (-3, -2, 8))
    for lx, ly, lw in rows:
        for i in range(lw):
            set_px(im, x + lx + i, y + ly, LEAF_L if i < 2 else LEAF)


def hedge(im, x, y, length):
    for i in range(length):
        leaf = LEAF_L if i % 5 < 2 else LEAF
        set_px(im, x + i, y - 4, LEAF_L if i % 3 == 0 else LEAF)
        set_px(im, x + i, y - 3, leaf)
        set_px(im, x + i, y - 2, LEAF)
        set_px(im, x + i, y - 1, GRASS_D)


def lamp(im, x, y):
    for i in range(16):
        set_px(im, x, y - 16 + i, CHARCOAL)
        set_px(im, x + 1, y - 16 + i, (28, 24, 22))
    fill_rect(im, x - 2, y - 22, 6, 6, GOLD)
    fill_rect(im, x - 1, y - 21, 4, 4, (236, 196, 96))
    set_px(im, x, y - 20, CREAM)
    set_px(im, x + 1, y - 20, CREAM)
    set_px(im, x - 1, y - 23, CHARCOAL)
    set_px(im, x + 2, y - 23, CHARCOAL)
    # Pool on the sidewalk, longer to the lower right.
    glow = (
        (-1, 0, 90), (0, 0, 150), (1, 0, 170), (2, 0, 180), (3, 0, 160),
        (4, 0, 130), (5, 0, 100), (6, 0, 70), (7, 0, 46), (8, 0, 28),
        (1, 1, 120), (2, 1, 140), (3, 1, 110), (4, 1, 80), (5, 1, 50),
        (2, 2, 70), (3, 2, 50), (0, 1, 80),
    )
    for dx, dy, amount in glow:
        tint(im, x + dx, y + dy, GLOW, amount)
    # A few solid pixels so the pool still reads on pale stone.
    for dx, color in ((1, (236, 196, 96)), (2, (210, 160, 64)), (3, (176, 128, 48)), (4, (140, 96, 40))):
        set_px(im, x + dx, y, color)
        set_px(im, x + dx, y + 1, color)


def fountain(im, x, y):
    """Basin on the plaza. y is the foot, on the same line as the other buildings."""
    fill_rect(im, x - 14, y - 4, 28, 4, STONE_D)
    fill_rect(im, x - 12, y - 7, 24, 3, STONE)
    for i in range(5):
        set_px(im, x - 14 + i, y - 6, STONE_L)
        set_px(im, x - 14 + i, y - 5, STONE_L)
    for row, half in ((-8, 10), (-9, 8), (-10, 6)):
        for i in range(-half, half + 1):
            if i < -half + 3:
                color = WATER_L
            elif i > half - 3:
                color = NAVY
            else:
                color = WATER
            set_px(im, x + i, y + row, color)
    for i in range(12):
        set_px(im, x, y - 22 + i, STONE_L if i < 4 else STONE)
        set_px(im, x + 1, y - 22 + i, STONE_D)
    for dx in range(-3, 4):
        set_px(im, x + dx, y - 23, WATER_L if dx < 1 else WATER)
    for dx in range(-1, 2):
        set_px(im, x + dx, y - 24, CREAM if dx < 1 else WATER_L)


def signpost(im, x, y):
    for i in range(13):
        set_px(im, x, y - 13 + i, WOOD_D)
    fill_rect(im, x - 7, y - 20, 11, 7, BURGUNDY)
    fill_rect(im, x - 6, y - 19, 9, 5, (96, 32, 36))
    for dx in range(-2, 2):
        set_px(im, x + dx, y - 17, GOLD)
    set_px(im, x + 1, y - 18, GOLD)
    set_px(im, x + 1, y - 16, GOLD)


def crates(im, x, y):
    def crate(cx, cy, cw, ch):
        fill_rect(im, cx, cy - ch, cw, ch, WOOD)
        for i in range(ch):
            set_px(im, cx, cy - ch + i, WOOD_L)
            set_px(im, cx + cw - 1, cy - ch + i, WOOD_D)
        for i in range(cw):
            set_px(im, cx + i, cy - 1, WOOD_D)
            set_px(im, cx + i, cy - ch // 2, WOOD_D)
    crate(x, y, 9, 7)
    crate(x + 1, y - 7, 7, 6)


def bench(im, x, y):
    fill_rect(im, x - 8, y - 8, 16, 2, WOOD)
    fill_rect(im, x - 8, y - 6, 16, 2, WOOD_L)
    for lx in (x - 6, x + 5):
        set_px(im, lx, y - 4, WOOD_D)
        set_px(im, lx, y - 3, WOOD_D)
        set_px(im, lx, y - 2, WOOD_D)
        set_px(im, lx, y - 1, WOOD_D)
    set_px(im, x - 8, y - 6, WOOD_L)
    set_px(im, x + 7, y - 6, WOOD_D)


def cart(im, x, y):
    """A hand cart: round wheels under a bed, a crate, and a handle to the right."""
    def wheel(wx):
        set_px(im, wx, y - 4, CHARCOAL)
        set_px(im, wx - 1, y - 3, CHARCOAL)
        set_px(im, wx + 1, y - 3, CHARCOAL)
        set_px(im, wx - 1, y - 2, CHARCOAL)
        set_px(im, wx, y - 2, (120, 108, 92))
        set_px(im, wx + 1, y - 2, CHARCOAL)
        set_px(im, wx, y - 1, CHARCOAL)
    wheel(x - 6)
    wheel(x + 5)
    fill_rect(im, x - 8, y - 8, 16, 4, WOOD)
    for i in range(4):
        set_px(im, x - 8, y - 8 + i, WOOD_L)
        set_px(im, x + 7, y - 8 + i, WOOD_D)
    fill_rect(im, x - 2, y - 12, 6, 4, (168, 116, 62))
    set_px(im, x - 2, y - 12, WOOD_L)
    set_px(im, x + 3, y - 12, WOOD_D)
    set_px(im, x + 8, y - 7, WOOD_D)
    set_px(im, x + 9, y - 8, WOOD_L)
    set_px(im, x + 10, y - 9, WOOD_L)
    set_px(im, x + 11, y - 9, WOOD_L)


def build():
    sky = blank()
    far = blank()
    town = blank()
    paint_sky(sky)
    paint_hills(far)
    paint_ground(town)

    town_hall = load_building("town-hall.png", "threeq", distant=True)
    tower = load_building("map-room-tower.png", "threeq", distant=True)
    lab = load_building("science-lab.png", "threeq", distant=True)
    academy = load_building("academy.png")
    printers = load_building("printers-shop.png")
    cottage = load_building("cottage.png")
    market = load_building("market-stall.png")

    print("back row")
    hill_shelf(far, 78, 276, 150)
    hill_path(far, 96, 268, 154)
    # Feet share the shelf. The path runs through the cluster.
    cast_shadow(far, 118, 156, 18)
    paste_foot(far, town_hall, 118, 156, "town hall")
    cast_shadow(far, 178, 156, 12)
    paste_foot(far, tower, 178, 156, "map room")
    cast_shadow(far, 236, 156, 14)
    paste_foot(far, lab, 236, 156, "lab")
    tree(far, 78, 156, "pine")
    bush(far, 156, 156)
    tree(far, 208, 156, "round")
    bush(far, 262, 156)
    tree(far, 430, 158, "pine")
    tree(far, 560, 162, "round")

    print("front row")
    # Plaza in front of the Academy, front edge on the shared baseline.
    plaza(town, 360, 424, BASE - 10, BASE)
    cast_shadow(town, 54, BASE, 14)
    paste_foot(town, cottage, 54, BASE, "cottage")
    cast_shadow(town, 470, BASE, 20)
    paste_foot(town, printers, 470, BASE, "printers")
    cast_shadow(town, 320, BASE - 6, 28)
    academy_span = paste_foot(town, academy, 320, BASE - 6, "academy")
    academy_steps(town, academy_span)
    cast_shadow(town, 568, BASE, 14)
    paste_foot(town, market, 568, BASE, "market")

    tree(town, 24, BASE, "pine")
    hedge(town, 78, BASE, 18)
    tree(town, 100, BASE, "autumn")
    hedge(town, 250, BASE, 16)
    tree(town, 268, BASE, "round")
    tree(town, 538, BASE, "autumn")
    hedge(town, 592, BASE, 14)
    tree(town, 618, BASE, "pine")

    lamp(town, 40, BASE + 2)
    lamp(town, 148, BASE + 2)
    lamp(town, 292, BASE + 2)
    lamp(town, 448, BASE + 2)
    lamp(town, 548, BASE + 2)
    lamp(town, 608, BASE + 2)

    cast_shadow(town, 396, BASE, 12)
    fountain(town, 396, BASE)
    signpost(town, 88, BASE + 4)
    crates(town, 128, BASE + 4)
    bench(town, 424, BASE + 4)
    cart(town, 516, BASE + 4)

    flat = Image.alpha_composite(sky, far)
    flat = Image.alpha_composite(flat, town)

    OUT.mkdir(parents=True, exist_ok=True)
    sky.save(OUT / "sky.png")
    far.save(OUT / "far.png")
    town.save(OUT / "town.png")
    flat.save(OUT / "panorama.png")
    print(f"wrote {W}x{H} layers to {OUT} (frame {FRAME}, street {18}px)")


if __name__ == "__main__":
    build()
