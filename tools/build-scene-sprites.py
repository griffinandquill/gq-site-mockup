#!/usr/bin/env python3
"""Build Quillhaven scene sprite sheets from the NPC frame export.

Frames are 96 by 96 with a clear margin. Each sheet lines the opaque
bottom of every frame up on the same row, crops to that shared box, then
nearest-neighbor halves the sheet so the pixels sit on the 640 by 256
town grid. The page draws the result at 2x with image-rendering: pixelated.

    python3 tools/build-scene-sprites.py /path/to/npc-anims

Writes img/quillhaven/sprites/*.png and prints the CSS frame size.
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "img" / "quillhaven" / "sprites"

# (file stem, character folder, animation, direction, frame count)
SHEETS = (
    ("tahne-idle", "Tahne_V3", "Breathing_Idle", "south", 4),
    ("merlin-idle", "Merlin", "Breathing_Idle", "south", 4),
    ("bramble-idle", "Professor_Bramble", "Breathing_Idle", "south", 4),
    ("winston-idle", "Winston_Wolf", "Breathing_Idle", "south", 4),
)

# East and west share one cell so the turnaround does not pop.
WALK = (
    ("winston-walk-east", "east"),
    ("winston-walk-west", "west"),
)

# Side-view sheets for the town cast. Idle and walk share one crop
# so a pause does not resize the sprite.
SIDE = (
    ("tahne", "Tahne_V3"),
    ("merlin", "Merlin"),
    ("bramble", "Professor_Bramble"),
    ("winston", "Winston_Wolf"),
)


def opaque_box(im: Image.Image) -> tuple[int, int, int, int]:
    px = im.load()
    width, height = im.size
    min_x, min_y, max_x, max_y = width, height, -1, -1
    for y in range(height):
        for x in range(width):
            if px[x, y][3]:
                if x < min_x:
                    min_x = x
                if y < min_y:
                    min_y = y
                if x > max_x:
                    max_x = x
                if y > max_y:
                    max_y = y
    if max_x < 0:
        raise SystemExit("frame has no opaque pixels")
    return min_x, min_y, max_x, max_y


def load_frames(src: Path, name: str, anim: str, direction: str, count: int) -> list[Image.Image]:
    folder = src / name / "Idle" / "animations" / anim / direction
    frames = []
    for index in range(count):
        path = folder / f"frame_{index:03d}.png"
        if not path.is_file():
            raise SystemExit(f"missing {path}")
        frame = Image.open(path).convert("RGBA")
        if frame.size != (96, 96):
            raise SystemExit(f"{path} is {frame.size}, expected 96x96")
        frames.append(frame)
    return frames


def build_side_sheets(src: Path) -> None:
    """East/west idle and walk, one shared crop per character."""
    for stem, name in SIDE:
        groups = {
            "idle-east": load_frames(src, name, "Breathing_Idle", "east", 4),
            "idle-west": load_frames(src, name, "Breathing_Idle", "west", 4),
            "walk-east": load_frames(src, name, "Walking", "east", 6),
            "walk-west": load_frames(src, name, "Walking", "west", 6),
        }
        raw = [frame for frames in groups.values() for frame in frames]
        foot = max(opaque_box(frame)[3] for frame in raw)
        height = max(frame.height for frame in raw)
        width = max(frame.width for frame in raw)
        if foot >= height:
            height = foot + 1
        aligned = {}
        flat = []
        for key, frames in groups.items():
            moved = []
            for frame in frames:
                shift = foot - opaque_box(frame)[3]
                canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
                canvas.paste(frame, (0, shift), frame)
                moved.append(canvas)
            aligned[key] = moved
            flat.extend(moved)
        crop = shared_crop(flat, width // 2)
        for key, frames in aligned.items():
            write_sheet(f"{stem}-{key}", frames, crop, width // 2, foot)


def align_feet(frames: list[Image.Image]) -> tuple[list[Image.Image], int]:
    """Shift each frame so the opaque bottom lands on the same row."""
    bottoms = [opaque_box(frame)[3] for frame in frames]
    foot = max(bottoms)
    aligned = []
    for frame, bottom in zip(frames, bottoms):
        shift = foot - bottom
        if shift == 0:
            aligned.append(frame)
            continue
        canvas = Image.new("RGBA", (frame.width, frame.height + shift), (0, 0, 0, 0))
        canvas.paste(frame, (0, shift), frame)
        aligned.append(canvas)
    return aligned, foot


def shared_crop(frames: list[Image.Image], anchor_x: int) -> tuple[int, int, int, int]:
    """Even crop that keeps the foot row and the registration column.

    One extra town pixel of margin (two source pixels) sits on the left,
    right, and top so a frame is not flush with the cell. The bottom row
    stays the foot.
    """
    boxes = [opaque_box(frame) for frame in frames]
    left = min(box[0] for box in boxes) - 2
    top = min(box[1] for box in boxes) - 2
    right = max(box[2] for box in boxes) + 2
    bottom = max(box[3] for box in boxes)
    left = min(left, anchor_x)
    right = max(right, anchor_x)
    limit_w = min(frame.width for frame in frames)
    limit_h = min(frame.height for frame in frames)
    left = max(0, left)
    top = max(0, top)
    right = min(limit_w - 1, right)
    bottom = min(limit_h - 1, bottom)
    if left % 2:
        left -= 1
    if top % 2:
        top -= 1
    if (right - left + 1) % 2:
        right += 1
    if (bottom - top + 1) % 2:
        if top >= 2:
            top -= 1
        else:
            bottom += 1
    if left < 0 or top < 0 or right >= limit_w or bottom >= limit_h:
        raise SystemExit("crop runs off a frame; feet were shifted too far")
    width = right - left + 1
    height = bottom - top + 1
    if width % 2 or height % 2:
        raise SystemExit(f"crop {width}x{height} is not even")
    return left, top, right, bottom


def half_keep(im: Image.Image) -> Image.Image:
    """Halve a pixel frame without dropping an opaque edge.

    Each output pixel reads its 2 by 2 block and keeps the lowest opaque
    pixel, so the foot row survives. A plain nearest resize can sample the
    row above the foot and leave a character floating.
    """
    width, height = im.size
    if width % 2 or height % 2:
        raise SystemExit(f"cannot halve {width}x{height}")
    out = Image.new("RGBA", (width // 2, height // 2), (0, 0, 0, 0))
    src = im.load()
    dst = out.load()
    for y in range(height // 2):
        for x in range(width // 2):
            chosen = None
            for dy in (1, 0):
                for dx in (0, 1):
                    pixel = src[x * 2 + dx, y * 2 + dy]
                    if pixel[3]:
                        chosen = pixel
                        break
                if chosen is not None:
                    break
            if chosen is not None:
                dst[x, y] = chosen
    return out


def build_sheet(frames: list[Image.Image], crop: tuple[int, int, int, int]) -> Image.Image:
    left, top, right, bottom = crop
    cell_w = (right - left + 1) // 2
    cell_h = (bottom - top + 1) // 2
    sheet = Image.new("RGBA", (cell_w * len(frames), cell_h), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        cell = half_keep(frame.crop((left, top, right + 1, bottom + 1)))
        sheet.paste(cell, (index * cell_w, 0), cell)
    return sheet


def write_sheet(stem: str, frames: list[Image.Image], crop: tuple[int, int, int, int], anchor_x: int, foot: int) -> None:
    sheet = build_sheet(frames, crop)
    path = OUT / f"{stem}.png"
    sheet.save(path)
    left, top, right, bottom = crop
    cell_w = (right - left + 1) // 2
    cell_h = (bottom - top + 1) // 2
    anchor = (anchor_x - left) // 2
    print(
        f"{path.relative_to(ROOT)} {sheet.size} cell {cell_w}x{cell_h} "
        f"anchor {anchor} source_foot {foot}"
    )


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: build-scene-sprites.py /path/to/npc-anims")
    src = Path(sys.argv[1])
    OUT.mkdir(parents=True, exist_ok=True)
    for stem, name, anim, direction, count in SHEETS:
        frames = load_frames(src, name, anim, direction, count)
        aligned, foot = align_feet(frames)
        anchor_x = frames[0].width // 2
        crop = shared_crop(aligned, anchor_x)
        write_sheet(stem, aligned, crop, anchor_x, foot)

    walks = []
    for stem, direction in WALK:
        frames = load_frames(src, "Winston_Wolf", "Walking", direction, 6)
        aligned, foot = align_feet(frames)
        walks.append((stem, aligned, foot))
    anchor_x = 48
    crop = shared_crop([frame for _, frames, _ in walks for frame in frames], anchor_x)
    for stem, aligned, foot in walks:
        write_sheet(stem, aligned, crop, anchor_x, foot)

    build_side_sheets(src)


if __name__ == "__main__":
    main()
