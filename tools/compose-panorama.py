#!/usr/bin/env python3
"""Compose the Quillhaven dusk panorama from the building sprites.

Native size is 640 by 256. The page shows the top 224 rows at 2x
(pixelated) and keeps the lower rows as ground for the parallax shift.
Positions below are hand placed on that grid. Light comes from the upper
left, so highlights sit on left edges and shadows fall to the lower right.

No prop sprites shipped with the buildings, so the trees, lamps, and
fountain are drawn here in the brand palette.

    python3 tools/compose-panorama.py
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BUILDINGS = ROOT / "img" / "buildings"
OUT = ROOT / "img" / "quillhaven"

W, H = 640, 256
FRAME = 224

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
MORTAR = (36, 32, 28)
WATER = (42, 72, 104)
WATER_L = (168, 196, 210)
LEAF = (24, 52, 34)
LEAF_L = (58, 96, 58)
LEAF_B = (92, 36, 40)
LEAF_BL = (138, 72, 48)


def blank():
    return Image.new("RGBA", (W, H), (0, 0, 0, 0))


def set_px(im, x, y, color):
    if 0 <= x < W and 0 <= y < H:
        im.putpixel((x, y), color if len(color) == 4 else (*color, 255))


def fill_rect(im, x, y, w, h, color):
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            set_px(im, xx, yy, color)


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


def half(im):
    return im.resize((im.width // 2, im.height // 2), Image.Resampling.NEAREST)


def load_building(name, scale="full", distant=False):
    im = Image.open(BUILDINGS / name).convert("RGBA")
    if scale == "half":
        im = half(im)
    if distant:
        im = push_navy(im, 0.42)
    return shade_light(im)


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
    return 112 + ((x - 300) * (x - 300)) // 4800


def far_crest(x):
    return 86 + ((x - 180) * (x - 180)) // 9000


def paint_hills(im):
    px = im.load()
    for x in range(W):
        far_y = far_crest(x)
        near_y = near_crest(x)
        for y in range(far_y, H):
            if y < near_y:
                # Sparse stipple, so the far ridge does not pick up a diagonal.
                color = (18, 28, 36) if (x % 11 == 0 and y % 5 == 0) else HILL_FAR
            else:
                band = y - near_y
                tuft = x % 17 == 0 and y % 4 == 0 and band < 18
                shade = x % 23 == 0 and y % 5 == 2
                if tuft and x < 340:
                    color = GRASS_L
                elif shade or band >= 16:
                    color = HILL_D
                else:
                    color = HILL
            # Ragged crest so the ridge is not a smooth curve of single pixels.
            if y == far_y and (x % 5 == 0):
                continue
            px[x, y] = (*color, 255)


def paint_ground(im):
    px = im.load()
    grass_top = 148
    curb = 168
    for y in range(grass_top, curb):
        for x in range(W):
            ragged = 1 if (x * 3) % 7 == 0 else 0
            if y < grass_top + ragged:
                continue
            if (x * 5 + y * 3) % 17 == 0:
                color = GRASS_L
            elif (x + y) % 11 == 0:
                color = GRASS_D
            else:
                color = GRASS if y < curb - 6 else GRASS_D
            px[x, y] = (*color, 255)

    # Academy terrace, raised above the street. Left faces catch the sun.
    terrace_l, terrace_r = 274, 370
    for y in range(150, 162):
        for x in range(terrace_l, terrace_r):
            edge = x < terrace_l + 3
            color = STONE_L if edge or x % 9 < 2 else STONE if x < 330 else STONE_D
            px[x, y] = (*color, 255)
    # Two steps down to the grass, centered on the door.
    for step, (y0, y1, inset) in enumerate(((162, 165, 10), (165, 168, 22))):
        for y in range(y0, y1):
            for x in range(terrace_l + inset, terrace_r - inset):
                color = STONE_L if x < terrace_l + inset + 2 else STONE if step == 0 else STONE_D
                px[x, y] = (*color, 255)

    # Stone walk from the steps into the street.
    for y in range(168, 186):
        for x in range(308, 332):
            px[x, y] = (*(STONE_L if x < 312 else STONE_D if x > 326 else STONE), 255)

    for x in range(W):
        px[x, curb] = (*STONE_L, 255)
        px[x, curb + 1] = (*STONE_D, 255)

    paint_cobbles(px, curb + 2, H)

    # A few flowers on the bank, left of the light.
    for x, y, color in (
        (52, 160, GOLD), (53, 160, GOLD), (70, 164, BURGUNDY),
        (188, 162, GOLD), (240, 158, BURGUNDY), (430, 161, GOLD),
        (468, 157, BURGUNDY), (530, 163, GOLD), (600, 159, BURGUNDY),
    ):
        set_px(im, x, y, color)


def paint_cobbles(px, y0, y1):
    stone_w, stone_h = 7, 4
    for y in range(y0, y1):
        row = (y - y0) // stone_h
        in_row = (y - y0) % stone_h
        shift = 3 if row % 2 else 0
        for x in range(W):
            if 308 <= x < 332 and y < 186:
                continue
            cell = (x + shift) % (stone_w + 1)
            if in_row == stone_h - 1 or cell == stone_w:
                color = MORTAR
            elif cell < 2:
                color = COBBLE_L
            else:
                vary = (x // 8 + row * 3) % 4
                color = COBBLE_D if vary == 0 else COBBLE
            px[x, y] = (*color, 255)


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
    # Warm pool on the street, longer to the right.
    for dx, alpha in ((3, 170), (4, 150), (5, 120), (6, 90)):
        set_px(im, x + dx, y, (150, 112, 40, alpha))
        set_px(im, x + dx, y + 1, (120, 88, 32, alpha - 30))


def fountain(im, x, y):
    """Stone basin on the cobbles. y is the foot. Light hits the left rim."""
    fill_rect(im, x - 18, y - 5, 36, 5, STONE_D)
    fill_rect(im, x - 16, y - 9, 32, 4, STONE)
    for i in range(6):
        set_px(im, x - 18 + i, y - 8, STONE_L)
        set_px(im, x - 18 + i, y - 7, STONE_L)
    for row, half in ((-10, 13), (-11, 11), (-12, 9), (-13, 7)):
        for i in range(-half, half + 1):
            if i < -half + 4:
                color = WATER_L
            elif i > half - 3:
                color = NAVY
            else:
                color = WATER
            set_px(im, x + i, y + row, color)
    for i in range(16):
        set_px(im, x, y - 29 + i, STONE_L if i < 5 else STONE)
        set_px(im, x + 1, y - 29 + i, STONE_D)
    for dx in range(-4, 5):
        set_px(im, x + dx, y - 31, WATER_L if dx < 2 else WATER)
        set_px(im, x + dx, y - 17, WATER_L if dx < 1 else NAVY)
    for dx in range(-2, 3):
        set_px(im, x + dx, y - 33, CREAM if dx < 1 else WATER_L)


def build():
    sky = blank()
    far = blank()
    town = blank()
    paint_sky(sky)
    paint_hills(far)
    paint_ground(town)

    town_hall = load_building("town-hall.png", "half", distant=True)
    tower = load_building("map-room-tower.png", "half", distant=True)
    lab = load_building("science-lab.png", "half", distant=True)
    academy = load_building("academy.png")
    printers = load_building("printers-shop.png")
    cottage = load_building("cottage.png")
    market = load_building("market-stall.png")

    print("back row")
    # Feet sit on the near hill, in the gaps the front row leaves open.
    cast_shadow(far, 138, near_crest(138) + 6, 14)
    paste_foot(far, town_hall, 138, near_crest(138) + 6, "town hall")
    cast_shadow(far, 248, near_crest(248) + 4, 10)
    paste_foot(far, tower, 248, near_crest(248) + 4, "map room")
    cast_shadow(far, 572, near_crest(572) + 6, 12)
    paste_foot(far, lab, 572, near_crest(572) + 6, "lab")
    tree(far, 64, near_crest(64) + 2, "pine")
    tree(far, 470, near_crest(470) + 2, "round")
    bush(far, 530, near_crest(530) + 2)

    print("front row")
    cast_shadow(town, 86, 166, 16)
    paste_foot(town, cottage, 86, 166, "cottage")
    cast_shadow(town, 196, 166, 22)
    paste_foot(town, printers, 196, 166, "printers")
    cast_shadow(town, 322, 158, 30)
    paste_foot(town, academy, 322, 158, "academy")
    cast_shadow(town, 508, 166, 16)
    paste_foot(town, market, 508, 166, "market")

    tree(town, 28, 166, "pine")
    tree(town, 124, 166, "autumn")
    tree(town, 256, 166, "round")
    bush(town, 292, 166)
    tree(town, 430, 166, "pine")
    tree(town, 468, 166, "autumn")
    bush(town, 548, 166)
    tree(town, 616, 166, "pine")

    lamp(town, 58, 170)
    lamp(town, 150, 170)
    lamp(town, 384, 170)
    lamp(town, 444, 170)
    lamp(town, 560, 170)
    fountain(town, 408, 206)

    flat = Image.alpha_composite(sky, far)
    flat = Image.alpha_composite(flat, town)

    OUT.mkdir(parents=True, exist_ok=True)
    sky.save(OUT / "sky.png")
    far.save(OUT / "far.png")
    town.save(OUT / "town.png")
    flat.save(OUT / "panorama.png")
    print(f"wrote {W}x{H} layers to {OUT} (frame {FRAME})")


if __name__ == "__main__":
    build()
