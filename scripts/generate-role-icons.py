from __future__ import annotations

from pathlib import Path
import shutil
import subprocess

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
PET_ROOT = ROOT / "apps/desktop-tauri/public/pets"
ICON_ROOT = ROOT / "apps/desktop-tauri/src-tauri/icons"
CELL_W = 192
CELL_H = 208


VARIANTS = {
    "xia-yizhou": {
        "sprite": PET_ROOT / "xia-yizhou/spritesheet.webp",
        "row": 3,
        "col": 3,
        "colors": ((255, 112, 122), (255, 199, 144)),
        "accent": (255, 234, 190),
    },
    "shen-xinghui": {
        "sprite": PET_ROOT / "shen-xinghui/spritesheet.webp",
        "row": 3,
        "col": 3,
        "colors": ((92, 140, 255), (218, 238, 255)),
        "accent": (242, 250, 255),
    },
}


def main() -> None:
    for variant_id, spec in VARIANTS.items():
        out_dir = ICON_ROOT / variant_id
        out_dir.mkdir(parents=True, exist_ok=True)
        icon = compose_icon(spec)
        write_icon_set(icon, out_dir)


def compose_icon(spec: dict) -> Image.Image:
    sprite = Image.open(spec["sprite"]).convert("RGBA")
    frame = sprite.crop(
        (
            spec["col"] * CELL_W,
            spec["row"] * CELL_H,
            (spec["col"] + 1) * CELL_W,
            (spec["row"] + 1) * CELL_H,
        )
    )
    bbox = frame.getchannel("A").getbbox()
    if bbox is not None:
        frame = frame.crop(bbox)

    size = 1024
    icon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bg = rounded_gradient(size, spec["colors"][0], spec["colors"][1])
    icon.alpha_composite(bg)

    draw = ImageDraw.Draw(icon)
    accent = spec["accent"]
    draw.ellipse((96, 92, 268, 264), fill=(*accent, 72))
    draw.ellipse((744, 124, 918, 298), fill=(*accent, 58))
    draw.rounded_rectangle((118, 768, 906, 906), radius=70, fill=(255, 255, 255, 46))

    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.ellipse((276, 790, 748, 920), fill=(38, 36, 54, 72))
    icon.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(24)))

    sprite_scale = min(720 / frame.width, 790 / frame.height)
    rendered = frame.resize(
        (round(frame.width * sprite_scale), round(frame.height * sprite_scale)),
        Image.Resampling.LANCZOS,
    )
    icon.alpha_composite(
        rendered,
        ((size - rendered.width) // 2, 128 + (790 - rendered.height) // 2),
    )
    return icon


def rounded_gradient(
    size: int,
    start: tuple[int, int, int],
    end: tuple[int, int, int],
) -> Image.Image:
    gradient = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    pixels = gradient.load()
    for y in range(size):
        for x in range(size):
            t = (x * 0.58 + y * 0.42) / (size - 1)
            r = round(start[0] * (1 - t) + end[0] * t)
            g = round(start[1] * (1 - t) + end[1] * t)
            b = round(start[2] * (1 - t) + end[2] * t)
            pixels[x, y] = (r, g, b, 255)

    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=224, fill=255)
    gradient.putalpha(mask)
    return gradient


def write_icon_set(icon: Image.Image, out_dir: Path) -> None:
    icon.resize((32, 32), Image.Resampling.LANCZOS).save(out_dir / "32x32.png")
    icon.resize((128, 128), Image.Resampling.LANCZOS).save(out_dir / "128x128.png")
    icon.resize((256, 256), Image.Resampling.LANCZOS).save(out_dir / "128x128@2x.png")

    ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    icon.save(out_dir / "icon.ico", sizes=ico_sizes)

    iconset = out_dir / "icon.iconset"
    if iconset.exists():
        shutil.rmtree(iconset)
    iconset.mkdir()
    for size in [16, 32, 128, 256, 512]:
        icon.resize((size, size), Image.Resampling.LANCZOS).save(
            iconset / f"icon_{size}x{size}.png"
        )
        icon.resize((size * 2, size * 2), Image.Resampling.LANCZOS).save(
            iconset / f"icon_{size}x{size}@2x.png"
        )
    subprocess.run(
        ["iconutil", "-c", "icns", str(iconset), "-o", str(out_dir / "icon.icns")],
        check=True,
    )
    shutil.rmtree(iconset)


if __name__ == "__main__":
    main()
