from PIL import Image

paths = [
    '/Users/benjaminapt/Documents/Wardrobe/data/imported/import-130b6cc8-a15a-4cc3-a3e4-883673985e32-garment.png',
    '/Users/benjaminapt/Documents/Wardrobe/data/imported/import-ebd98960-92d3-4f4e-bd9d-cc58431e1d16-garment.png',
    '/Users/benjaminapt/Documents/Wardrobe/data/imported/import-d4e79971-cfb0-491e-a8cf-a1f79ab9c7c2-garment.png',
    '/Users/benjaminapt/Documents/Wardrobe/data/imported/import-59c6e092-8a3b-4632-b946-0822feac3912-garment.png'
]
images = [Image.open(p) for p in paths]
h = 500
widths = [int(i.width * (h / i.height)) for i in images]
w = sum(widths)
new_img = Image.new('RGBA', (w, h), (255, 255, 255, 0))
x = 0
for i, i_w in zip(images, widths):
    i = i.resize((i_w, h))
    new_img.paste(i, (x, 0))
    x += i_w
new_img.save('/Users/benjaminapt/Documents/Wardrobe/combined_garments.png')
