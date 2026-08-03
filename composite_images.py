import sys
from PIL import Image

def composite_images(output_path, image_paths):
    images = [Image.open(p) for p in image_paths]
    widths, heights = zip(*(i.size for i in images))
    
    total_width = sum(widths)
    max_height = max(heights)
    
    new_im = Image.new('RGBA', (total_width, max_height))
    
    x_offset = 0
    for im in images:
        new_im.paste(im, (x_offset,0))
        x_offset += im.size[0]
        
    new_im.save(output_path)

if __name__ == '__main__':
    output_path = sys.argv[1]
    image_paths = sys.argv[2:]
    composite_images(output_path, image_paths)
