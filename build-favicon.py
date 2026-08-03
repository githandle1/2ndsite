#!/usr/bin/env python3
"""Build a multi-size favicon.ico from PNG files."""

import struct
import sys
from pathlib import Path


def read_png_size(data: bytes) -> tuple[int, int]:
    return struct.unpack(">II", data[16:24])


def build_ico(png_paths: list[Path], out_path: Path) -> None:
    images: list[tuple[int, int, bytes]] = []
    for path in png_paths:
        data = path.read_bytes()
        width, height = read_png_size(data)
        images.append((width, height, data))

    header = struct.pack("<HHH", 0, 1, len(images))
    entries = bytearray()
    blobs = bytearray()
    offset = 6 + 16 * len(images)

    for width, height, data in images:
        width_byte = 0 if width >= 256 else width
        height_byte = 0 if height >= 256 else height
        entries.extend(
            struct.pack(
                "<BBBBHHII",
                width_byte,
                height_byte,
                0,
                0,
                1,
                32,
                len(data),
                offset,
            )
        )
        blobs.extend(data)
        offset += len(data)

    out_path.write_bytes(header + bytes(entries) + bytes(blobs))


if __name__ == "__main__":
    root = Path(__file__).resolve().parent
    pngs = [root / name for name in ("favicon-16.png", "favicon-32.png", "favicon-48.png")]
    build_ico(pngs, root / "favicon.ico")
    print("Wrote favicon.ico")
