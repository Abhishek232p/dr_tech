from PIL import Image, ImageDraw, ImageFont
import os

def create_placeholder(filename, color, text):
    img = Image.new('RGB', (500, 500), color=color)
    d = ImageDraw.Draw(img)
    # Just draw text if default font works, otherwise just a solid color block
    try:
        d.text((50, 250), text, fill=(255,255,255))
    except:
        pass
    img.save(filename, 'WEBP')

systems = {
    'cardiovascular': {
        'color': '#ff4d4d',
        'types': ['microscopic.webp', 'compare.webp']
    },
    'nervous': {
        'color': '#fbc02d',
        'types': ['thumb.webp', 'organ.webp', 'location.webp', 'microscopic.webp', 'compare.webp']
    }
}

for system, data in systems.items():
    directory = f'public/anatomy/{system}'
    os.makedirs(directory, exist_ok=True)
    for img_type in data['types']:
        filepath = os.path.join(directory, img_type)
        create_placeholder(filepath, data['color'], f"{system.capitalize()}\n{img_type}")

print("Placeholder images created.")
