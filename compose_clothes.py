import sys
from PIL import Image

def concat_images(image_paths, output_path):
    images = [Image.open(p) for p in image_paths]
    max_height = max(img.height for img in images)
    
    resized_images = []
    for img in images:
        aspect_ratio = img.width / img.height
        new_width = int(max_height * aspect_ratio)
        resized_images.append(img.resize((new_width, max_height)))
        
    total_width = sum(img.width for img in resized_images)
    
    result = Image.new('RGBA', (total_width, max_height))
    
    x_offset = 0
    for img in resized_images:
        result.paste(img, (x_offset, 0))
        x_offset += img.width
        
    result.save(output_path)

if __name__ == "__main__":
    paths = sys.argv[1:-1]
    out_path = sys.argv[-1]
    concat_images(paths, out_path)
