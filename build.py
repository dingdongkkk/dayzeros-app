#!/usr/bin/env python3
"""Inline the meadow background into src/template.html to produce index.html.

The published page is a single self-contained file, so the background image is
embedded as a data URI. Edit src/template.html (which keeps the __MEADOW__
placeholder), then run this to regenerate index.html.
"""
import base64, pathlib

root = pathlib.Path(__file__).parent
img = root / "assets" / "meadow.webp"
tpl = root / "src" / "template.html"
out = root / "index.html"

data = base64.b64encode(img.read_bytes()).decode()
out.write_text(tpl.read_text().replace("__MEADOW__", "data:image/webp;base64," + data))
print(f"wrote {out.name} ({out.stat().st_size / 1048576:.2f} MB)")
