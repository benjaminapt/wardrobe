import os
from glob import glob
from PIL import Image, ImageDraw, ImageFont

def create_contact_sheets():
    images_dir = 'data/outfit-images'
    output_dir = 'data/tmp_qa'
    os.makedirs(output_dir, exist_ok=True)
    
    # Get all 31 images (or whatever is there)
    images = glob(f'{images_dir}/*.png')
    images.sort()
    
    batch_size = 12
    for i in range(0, len(images), batch_size):
        batch = images[i:i+batch_size]
        
        # We will make a 4x3 grid (4 cols, 3 rows)
        # Assuming images are 1024x1024. Let's resize them to 512x512 to save memory
        thumb_size = 512
        cols, rows = 4, 3
        
        contact_sheet = Image.new('RGB', (cols * thumb_size, rows * thumb_size + (rows * 40)), 'white')
        draw = ImageDraw.Draw(contact_sheet)
        
        for idx, img_path in enumerate(batch):
            try:
                img = Image.open(img_path).convert('RGB')
                img.thumbnail((thumb_size, thumb_size))
                
                col = idx % cols
                row = idx // cols
                
                x = col * thumb_size
                y = row * (thumb_size + 40)
                
                contact_sheet.paste(img, (x, y))
                
                # Draw filename for identification
                name = os.path.basename(img_path)
                draw.text((x + 10, y + thumb_size + 10), name, fill="black")
                
            except Exception as e:
                print(f"Error loading {img_path}: {e}")
                
        out_path = os.path.join(output_dir, f'qa_sheet_{i//batch_size}.png')
        contact_sheet.save(out_path)
        print(f"Saved {out_path}")

if __name__ == '__main__':
    create_contact_sheets()
