from PIL import Image, ImageDraw, ImageFont

SIZE = 1024
MARGIN = 120
R = 200

img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

# Dark squircle
d.rounded_rectangle(
    [MARGIN, MARGIN, SIZE - MARGIN - 1, SIZE - MARGIN - 1],
    radius=R, fill=(10, 14, 23, 255)
)

# Letter Q
try:
    font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Futura.ttc', 420)
except:
    font = ImageFont.truetype('/Library/Fonts/Arial Black.ttf', 420)

bbox = d.textbbox((0, 0), 'Q', font=font)
x = (SIZE - (bbox[2] - bbox[0])) / 2 - bbox[0]
y = (SIZE - (bbox[3] - bbox[1])) / 2 - bbox[1]

# Glow effect
for offset in range(3, 0, -1):
    glow_alpha = 40 // offset
    d.text((x, y), 'Q', font=font, fill=(74, 163, 255, glow_alpha))

d.text((x, y), 'Q', font=font, fill=(255, 255, 255, 255))

img.save('/Users/ericstone/Downloads/data-agent/desktop/icon_1024.png')
print("Icon saved")
