import fs from 'fs';
import path from 'path';

const outfitsData = JSON.parse(fs.readFileSync('data/outfits.json', 'utf8'));
const libraryData = JSON.parse(fs.readFileSync('data/library.json', 'utf8'));

const libraryMap = {};
for (const item of libraryData) {
  libraryMap[item.id] = item;
}

const prompts = [];

for (const outfit of outfitsData.outfits) {
  if (outfit.status === 'planned') {
    let prompt = `You are an expert fashion photographer and AI image generation specialist. Your task is to generate a modeled outfit image for outfit ID: ${outfit.id}\n\n`;
    prompt += `Outfit Name: ${outfit.name}\n`;
    prompt += `Reasoning: ${outfit.reason}\n`;
    prompt += `Setting: ${outfit.setting}\n\n`;
    
    prompt += `Here are the reference images you must use:\n`;
    prompt += `1. Identity Reference: data/model-reference.png\n`;
    
    let counter = 2;
    const referencePaths = ['data/model-reference.png'];
    
    for (const garmentId of outfit.garmentIds) {
      const garment = libraryMap[garmentId];
      if (garment) {
        const imagePath = garment.image; // e.g., "/api/import/library/import-xxx-garment.png"
        const filename = imagePath.split('/').pop();
        const localPath = `data/imported/${filename}`;
        prompt += `${counter}. ${garment.part} reference: ${localPath} (Tags: ${garment.tags.join(', ')})\n`;
        referencePaths.push(localPath);
        counter++;
      }
    }
    
    prompt += `\nInstructions:\n`;
    prompt += `1. Read the file .agents/skills/generate-outfits/references/outfit-image-prompt.md to understand how to construct the image generation prompt.\n`;
    prompt += `2. Use the 'generate_image' tool with the reference paths provided above (they are absolute paths in the project directory, so prefix them with /Users/benjaminapt/Documents/Wardrobe/). The ImageName should be '${outfit.id}'.\n`;
    prompt += `3. Verify the generated image against the requirements in the skill documentation (recognizability, all garments present, no extra items, correct layering, etc.).\n`;
    prompt += `4. If the image fails verification, regenerate it by modifying the prompt and pointing out the errors.\n`;
    prompt += `5. Once successful, reply to me with a summary containing:\n`;
    prompt += `   - Outfit ID: ${outfit.id}\n`;
    prompt += `   - Generated Image Path: the path returned by the tool\n`;
    prompt += `   - Status: success (or failed if you couldn't get it right after several tries)\n`;
    prompt += `   - Visual Review Notes: your analysis of why the image passes or fails.\n`;
    
    prompts.push({
      TypeName: "research",
      Role: "Image Generator",
      Prompt: prompt,
      Model: "flash"
    });
  }
}

console.log(JSON.stringify(prompts, null, 2));
