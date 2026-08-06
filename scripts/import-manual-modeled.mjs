#!/usr/bin/env node
/**
 * import-manual-modeled.mjs
 * 
 * Scans /tmp/gemini-queue/NN-*/ folders for "modeled.png" files,
 * copies them into data/imported/ with the correct name,
 * and updates library.json with the modeledImage path.
 * 
 * Usage: node scripts/import-manual-modeled.mjs [--queue /path/to/queue]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LIBRARY_PATH = path.join(ROOT, 'data', 'library.json');
const IMPORTED_DIR = path.join(ROOT, 'data', 'imported');

const args = process.argv.slice(2);
let queueDir = '/tmp/gemini-queue';
const queueIdx = args.indexOf('--queue');
if (queueIdx !== -1 && args[queueIdx + 1]) {
  queueDir = args[queueIdx + 1];
}

if (!fs.existsSync(queueDir)) {
  console.error(`Queue directory not found: ${queueDir}`);
  process.exit(1);
}

const library = JSON.parse(fs.readFileSync(LIBRARY_PATH, 'utf8'));
const libraryById = new Map(library.map(item => [item.id, item]));

const folders = fs.readdirSync(queueDir)
  .filter(name => /^\d{2}-/.test(name))
  .sort();

let imported = 0;
let skipped = 0;

for (const folder of folders) {
  const folderPath = path.join(queueDir, folder);
  if (!fs.statSync(folderPath).isDirectory()) continue;

  // Check if there's a modeled.png (or any image file the user may have named differently)
  const files = fs.readdirSync(folderPath);
  const modeledFile = files.find(f => 
    f === 'modeled.png' || f === 'modeled.jpg' || f === 'modeled.jpeg' ||
    f.endsWith('-modeled.png') || f.endsWith('-modeled.jpg')
  );

  if (!modeledFile) {
    skipped++;
    continue;
  }

  // Read the target filename from GUARDAR-COMO.txt
  const guardarPath = path.join(folderPath, 'GUARDAR-COMO.txt');
  if (!fs.existsSync(guardarPath)) {
    console.warn(`  ⚠ No GUARDAR-COMO.txt in ${folder}, skipping`);
    skipped++;
    continue;
  }

  const targetName = fs.readFileSync(guardarPath, 'utf8').trim();
  // targetName is like "import-XXXX-modeled.png"
  const itemId = targetName.replace('-modeled.png', '').replace('-modeled.jpg', '');

  const item = libraryById.get(itemId);
  if (!item) {
    console.warn(`  ⚠ Item ${itemId} not found in library, skipping`);
    skipped++;
    continue;
  }

  if (item.modeledImage) {
    console.log(`  ✓ ${item.name} already has modeled image, skipping`);
    skipped++;
    continue;
  }

  // Copy the file
  const srcPath = path.join(folderPath, modeledFile);
  const destPath = path.join(IMPORTED_DIR, targetName);
  fs.copyFileSync(srcPath, destPath);

  // Update library entry
  item.modeledImage = `/api/import/library/${targetName}`;

  console.log(`  ✅ ${item.name} → ${targetName}`);
  imported++;
}

// Write updated library
fs.writeFileSync(LIBRARY_PATH, JSON.stringify(library, null, 2));

console.log(`\n📊 Results: ${imported} imported, ${skipped} skipped (${folders.length} total folders)`);

if (imported > 0) {
  console.log(`\n🎉 Done! Run 'npm run build:static && npx vercel deploy --prebuilt --prod' to update the live site.`);
}
