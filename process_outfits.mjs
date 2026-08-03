import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const outDir = 'data/outfit-images';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Maps outfit ID to the generated file path based on the system messages we received
const results = {
  "earth-tone-bomber": "/Users/benjaminapt/.gemini/antigravity/brain/9d67a25e-1986-4863-bc38-eb48bfff8391/earth_tone_bomber_1785511825492.jpg",
  "summer-abstract": "/Users/benjaminapt/.gemini/antigravity/brain/744300d6-70ad-4ae3-88e2-658d529203dc/summer_abstract_1785511872302.jpg",
  "field-utility-red": "/Users/benjaminapt/.gemini/antigravity/brain/7d220190-bd06-4279-b4da-2e26a84ccdfb/field_utility_red_1785511875865.jpg",
  "graphic-streetwear": "/Users/benjaminapt/.gemini/antigravity/brain/5bfebc45-ef39-4fc2-b691-382c0c200310/graphic_streetwear_1785511888331.jpg",
  "beach-day-pink": "/Users/benjaminapt/.gemini/antigravity/brain/188ce11a-adbf-476b-abe6-cb865e5cef67/beach_day_pink_1785511886824.jpg",
  "navy-formal-suit": "/Users/benjaminapt/.gemini/antigravity/brain/07a92ee0-fa93-45ee-ad36-24565656cc32/navy_formal_suit_1785511888130.jpg",
  "leather-edge-minimal": "/Users/benjaminapt/.gemini/antigravity/brain/71e9d6d0-630b-418d-a46e-e7a2b02d4781/leather_edge_minimal_1785511900412.jpg",
  "smart-blue-blazer": "/Users/benjaminapt/.gemini/antigravity/brain/6f9f0500-31c5-45b6-b65b-68c2759ceafb/smart_blue_blazer_1785511929312.jpg",
  "sporty-nike-casual": "/Users/benjaminapt/.gemini/antigravity/brain/24468937-f4af-4aff-ad48-4158dbbd9005/sporty_nike_casual_1785511947681.jpg"
};

const outfitsData = JSON.parse(fs.readFileSync('data/outfits.json', 'utf8'));

for (let outfit of outfitsData.outfits) {
  if (results[outfit.id]) {
    const srcPath = results[outfit.id];
    const destPng = path.join(outDir, `${outfit.id}.png`);
    console.log(`Processing ${outfit.id}...`);
    // Copy and convert using sips
    execSync(`sips -s format png "${srcPath}" --out "${destPng}"`);
    
    // Update the manifest
    outfit.image = `/api/import/outfits/${outfit.id}.png`;
    outfit.status = 'active'; // Mark as active now that it has an image
  }
}

fs.writeFileSync('data/outfits.json', JSON.stringify(outfitsData, null, 2));
console.log('Successfully copied and converted 9 images, and updated outfits.json.');
