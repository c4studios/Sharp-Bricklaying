import os, shutil
from PIL import Image

img_dir = os.path.join(os.path.dirname(__file__), 'images')
upload_dir = os.path.join(os.path.dirname(__file__), 'uploads')

# Mapping: clean name -> original name
originals = {
    'hero-bg.jpg': 'WhatsApp Image 2026-04-20 at 1.56.30 PM (2).jpeg',
    'about-onsite.jpg': 'WhatsApp Image 2026-04-20 at 1.57.04 PM.jpeg',
    'project-residential.jpg': 'WhatsApp Image 2026-04-20 at 1.56.30 PM (1).jpeg',
    'project-double-storey.jpg': 'WhatsApp Image 2026-04-20 at 1.56.30 PM.jpeg',
    'project-prestige.jpg': 'WhatsApp Image 2026-04-20 at 1.57.05 PM.jpeg',
    'logo-green-bg.jpg': 'SharpBricklaying_Logo_GreenBG.jpg',
}

for clean, orig in originals.items():
    orig_path = os.path.join(upload_dir, orig)
    clean_path = os.path.join(img_dir, clean)
    shutil.copy2(orig_path, clean_path)
    orig_size = os.path.getsize(clean_path)
    img = Image.open(clean_path)
    if img.width > 1920:
        ratio = 1920 / img.width
        img = img.resize((1920, int(img.height * ratio)), Image.LANCZOS)
    temp_path = clean_path + '.tmp'
    img.save(temp_path, 'JPEG', quality=78, optimize=True)
    new_size = os.path.getsize(temp_path)
    if new_size < orig_size:
        os.replace(temp_path, clean_path)
        print(f'{clean}: {orig_size//1024}KB -> {new_size//1024}KB (saved {(orig_size-new_size)//1024}KB)')
    else:
        os.remove(temp_path)
        print(f'{clean}: {orig_size//1024}KB kept original (re-encode was {new_size//1024}KB)')

print('Done!')
