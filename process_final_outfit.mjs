import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const outDir = 'data/outfit-images';
const outfitId = 'dark-street-layer';
const srcPath = '/Users/benjaminapt/.gemini/antigravity/brain/b3d126fe-9277-4f8a-883e-b32ceb7df172/dark_street_layer_alleyway_1785517021942.jpg';
const destPng = path.join(outDir, `${outfitId}.png`);

execSync(`sips -s format png "${srcPath}" --out "${destPng}"`);

const outfitsData = JSON.parse(fs.readFileSync('data/outfits.json', 'utf8'));
for (let outfit of outfitsData.outfits) {
  if (outfit.id === outfitId) {
    outfit.image = `/api/import/outfits/${outfit.id}.png`;
    outfit.status = 'active';
  }
}
fs.writeFileSync('data/outfits.json', JSON.stringify(outfitsData, null, 2));
console.log('Processed dark-street-layer');
