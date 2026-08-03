from PIL import Image
import os

def concat_images(image_paths, output_path):
    # Filter out paths that might not exist just in case
    images = [Image.open(p) for p in image_paths if os.path.exists(p)]
    if not images:
        print("No images found.")
        return
        
    widths, heights = zip(*(i.size for i in images))

    total_width = sum(widths)
    max_height = max(heights)

    new_im = Image.new('RGBA', (total_width, max_height))

    x_offset = 0
    for im in images:
        new_im.paste(im, (x_offset, 0))
        x_offset += im.size[0]

    new_im.save(output_path)
    print("Montage created at", output_path)

if __name__ == '__main__':
    paths = [
        'data/imported/import-ecd0c30c-86c8-4e90-b159-4e11636c6dc3-garment.png', # top
        'data/imported/import-da283d4f-4232-457a-a426-40dde994fb1c-garment.png', # bottom
        'data/imported/import-8357756b-8a69-46ef-91d9-896b72154a58-garment.png', # outer
        'data/imported/import-766f51bf-af04-4c94-9814-e891143d0311-garment.png'  # shoes
    ]
    concat_images(paths, 'data/montage-garments.png')
