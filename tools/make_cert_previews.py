"""Build watermarked, redacted WebP previews of certificate pages for the Credentials page."""
import json, sys
from PIL import Image, ImageDraw, ImageFont

SRC, OUT = sys.argv[1], sys.argv[2]
ROT = {26, 27, 28, 29}  # pages scanned sideways
# (page) -> list of boxes to cover (coordinates on the upright 100-dpi render)
REDACT = {
    26: [(520, 226, 915, 266)],   # Emirates ID
    27: [(515, 228, 875, 266)],   # Emirates ID
    25: [(505, 246, 875, 280)],   # Emirates ID
    18: [(200, 512, 630, 562)],   # current employer name
}
MAP = {  # certification id -> pages (first = cover image)
    20: [1], 21: [14, 12, 13], 22: [9], 23: [7], 25: [11], 26: [23, 24], 29: [15], 30: [16],
    31: [22], 32: [18], 33: [19], 34: [17], 35: [21], 36: [20], 37: [26], 38: [25], 39: [27],
    40: [6, 3, 5], 41: [29], 42: [28],
}
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 26)
    small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 15)
except OSError:
    font = small = ImageFont.load_default()

def page(n):
    im = Image.open(f"{SRC}/p-{n:02d}.png").convert("RGB")
    if n in ROT:
        im = im.rotate(90, expand=True)
    d = ImageDraw.Draw(im)
    for box in REDACT.get(n, []):
        d.rectangle(box, fill=(236, 236, 236))
        d.text(((box[0] + box[2]) // 2, (box[1] + box[3]) // 2), "Withheld for privacy", fill=(120, 120, 120), font=small, anchor="mm")
    # faint diagonal watermark
    wm = Image.new("RGBA", im.size, (0, 0, 0, 0))
    wd = ImageDraw.Draw(wm)
    label = "josh-portfolio.jt3rdegre3.com  ·  Verification copy"
    step_y = 230
    for y in range(-im.size[1], im.size[1] * 2, step_y):
        wd.text((-200, y), (label + "      ") * 4, fill=(150, 120, 60, 42), font=font)
    wm = wm.rotate(28, expand=False, center=(im.size[0] // 2, im.size[1] // 2))
    im = Image.alpha_composite(im.convert("RGBA"), wm).convert("RGB")
    if im.width > 1000:
        im = im.resize((1000, round(im.height * 1000 / im.width)), Image.LANCZOS)
    return im

manifest = {}
for cid, pages in MAP.items():
    files = []
    for i, n in enumerate(pages, 1):
        name = f"cert-{cid}-{i}.webp"
        page(n).save(f"{OUT}/{name}", "WEBP", quality=70, method=6)
        files.append(f"certs/{name}")
    manifest[cid] = files
print(json.dumps(manifest))
