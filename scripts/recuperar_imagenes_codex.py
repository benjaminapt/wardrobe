#!/usr/bin/env python3
import os
import json
import shutil
from glob import glob

def main():
    base_dir = os.path.expanduser('~/.codex/generated_images')
    outfits_file = 'data/outfits.json'
    output_dir = 'data/outfit-images'
    
    # 1. Encontrar todas las imágenes generadas por el script el 11 de Agosto
    dirs = glob(f'{base_dir}/*')
    valid_images = []
    
    for d in dirs:
        images = glob(f'{d}/exec-*.png')
        if images:
            img_path = images[0]
            stat = os.stat(img_path)
            # 1723408500 = 2026-08-11 16:35:00 local time approx
            # Filtramos solo las que son de nuestra corrida de hoy
            from datetime import datetime
            dt = datetime.fromtimestamp(stat.st_mtime)
            if dt.year == 2026 and dt.month == 8 and dt.day == 11 and dt.hour >= 16:
                valid_images.append((stat.st_mtime, img_path))
                
    valid_images.sort() # Orden cronológico exacto
    print(f"Se encontraron {len(valid_images)} imágenes generadas hoy.")
    
    # 2. Leer outfits.json
    with open(outfits_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    outfits = data.get('outfits', [])
    
    # 3. Mapear y copiar 1:1
    os.makedirs(output_dir, exist_ok=True)
    
    img_idx = 0
    for outfit in outfits:
        if img_idx >= len(valid_images):
            break
            
        # El script original se saltó los 'accepted'
        if outfit.get('status') == 'accepted':
            continue
            
        _, src_img = valid_images[img_idx]
        outfit_id = outfit['id']
        
        dst_img = os.path.join(output_dir, f"{outfit_id}.png")
        shutil.copy2(src_img, dst_img)
        print(f"Recuperada: {outfit_id}.png")
        
        outfit['image'] = f"outfit-images/{outfit_id}.png"
        outfit['status'] = 'generated' # Actualizar estado
        
        img_idx += 1
        
    # 4. Guardar JSON
    with open(outfits_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        
    print(f"Se enlazaron exitosamente {img_idx} imágenes y se actualizó outfits.json.")

if __name__ == '__main__':
    main()
