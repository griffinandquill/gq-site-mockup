#!/usr/bin/env python3
"""Build Brittany, Ruth, and Rudy town sheets from their walk and idle frames.

The exports are not one canvas size. Each frame is nearest-neighbor scaled
so its opaque height matches the tallest frame of that child, then every
frame shares one foot line and one center column. The sheet is halved onto
the town grid the same way as the NPC sheets.

    python3 tools/build-kid-sprites.py /tmp/kid-frames

Writes img/quillhaven/sprites/{brittany,ruth,rudy}-{idle,idle-east,idle-west,walk-east,walk-west}.png
"""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "img" / "quillhaven" / "sprites"

POSES = (
    ("idle", "idle-south.png"),
    ("idle-east", "idle-east.png"),
    ("idle-west", "idle-west.png"),
    ("walk-east", "walk-east"),
    ("walk-west", "walk-west"),
)


def load_builder():
    path = ROOT / "tools" / "build-scene-sprites.py"
    spec = importlib.util.spec_from_file_location("build_scene_sprites", path)
    if spec is None or spec.loader is None:
        raise SystemExit(f"cannot load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def load_pose(folder: Path, pose: str, source: str) -> list[Image.Image]:
    if source.endswith(".png"):
        path = folder / source
        if not path.is_file():
            raise SystemExit(f"missing {path}")
        return [Image.open(path).convert("RGBA")]
    frames = []
    for index in range(6):
        path = folder / f"{source}-{index:03d}.png"
        if not path.is_file():
            raise SystemExit(f"missing {path}")
        frames.append(Image.open(path).convert("RGBA"))
    return frames


def fit_height(frame: Image.Image, target: int, opaque_box) -> Image.Image:
    box = opaque_box(frame)
    height = box[3] - box[1] + 1
    if height == target:
        return frame
    scale = target / height
    size = (max(1, round(frame.width * scale)), max(1, round(frame.height * scale)))
    return frame.resize(size, Image.Resampling.NEAREST)


def unify(frames: list[Image.Image], opaque_box) -> tuple[list[Image.Image], int]:
    """One canvas, feet on the same row, opaque centers on one even column."""
    heights = [opaque_box(frame)[3] - opaque_box(frame)[1] + 1 for frame in frames]
    target = max(heights)
    fitted = [fit_height(frame, target, opaque_box) for frame in frames]
    boxes = [opaque_box(frame) for frame in fitted]
    foot = max(box[3] for box in boxes)
    centers = [(box[0] + box[2]) / 2 for box in boxes]
    anchor = int(round(max(centers)))
    if anchor % 2:
        anchor += 1
    shifts_y = [foot - box[3] for box in boxes]
    shifts_x = [int(round(anchor - center)) for center in centers]
    min_x = min(shifts_x)
    if min_x < 0:
        bump = -min_x
        if bump % 2:
            bump += 1
        anchor += bump
        shifts_x = [shift + bump for shift in shifts_x]
    width = max(shift + frame.width for shift, frame in zip(shifts_x, fitted))
    height = max(shift + frame.height for shift, frame in zip(shifts_y, fitted))
    if width % 2:
        width += 1
    if height % 2:
        height += 1
    placed = []
    for frame, shift_x, shift_y in zip(fitted, shifts_x, shifts_y):
        canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        canvas.paste(frame, (shift_x, shift_y), frame)
        placed.append(canvas)
    return placed, anchor


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: build-kid-sprites.py /path/to/kid-frames")
    src = Path(sys.argv[1])
    builder = load_builder()
    OUT.mkdir(parents=True, exist_ok=True)
    for name in ("brittany", "ruth", "rudy"):
        folder = src / name
        groups = {pose: load_pose(folder, pose, source) for pose, source in POSES}
        raw = [frame for frames in groups.values() for frame in frames]
        placed, anchor = unify(raw, builder.opaque_box)
        cursor = 0
        aligned = {}
        for pose, _source in POSES:
            count = len(groups[pose])
            aligned[pose] = placed[cursor:cursor + count]
            cursor += count
        crop = builder.shared_crop(placed, anchor)
        for pose, frames in aligned.items():
            builder.write_sheet(f"{name}-{pose}", frames, crop, anchor, 0)


if __name__ == "__main__":
    main()
