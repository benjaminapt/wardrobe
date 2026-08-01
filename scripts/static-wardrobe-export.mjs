import { access, copyFile, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const LIBRARY_PREFIX = "/api/import/library/";
const STATIC_PREFIX = "/wardrobe/assets/";
const OUTFIT_PREFIX = "/api/import/outfits/";
const STATIC_OUTFIT_PREFIX = "/wardrobe/outfits/";
const REQUIRED_FIELDS = ["image", "thumbnail"];

function assetName(value) {
  if (typeof value !== "string" || !value.startsWith(LIBRARY_PREFIX)) {
    throw new Error(`Invalid wardrobe asset URL: ${String(value)}`);
  }
  const name = value.slice(LIBRARY_PREFIX.length);
  if (!name || name !== path.basename(name) || name.includes("\\")) {
    throw new Error(`Invalid wardrobe asset URL: ${value}`);
  }
  return name;
}

function outfitImageName(value) {
  if (typeof value !== "string" || !value.startsWith(OUTFIT_PREFIX)) {
    throw new Error(`Invalid outfit image URL: ${String(value)}`);
  }
  const name = value.slice(OUTFIT_PREFIX.length);
  if (!name || name !== path.basename(name) || name.includes("\\")) {
    throw new Error(`Invalid outfit image URL: ${value}`);
  }
  return name;
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

export async function exportStaticWardrobe({ libraryPath, assetRoot, outputDir, outfitsPath, outfitImageRoot }) {
  const library = JSON.parse(await readFile(libraryPath, "utf8"));
  if (!Array.isArray(library)) throw new Error("Wardrobe library must be an array");

  const parentDir = path.dirname(outputDir);
  const temporaryDir = path.join(parentDir, `.${path.basename(outputDir)}-${process.pid}-${Date.now()}`);
  const temporaryAssets = path.join(temporaryDir, "assets");
  const copied = new Set();
  await rm(temporaryDir, { recursive: true, force: true });
  await mkdir(temporaryAssets, { recursive: true });

  try {
    const exported = [];
    for (const item of library) {
      const next = { ...item };
      for (const field of REQUIRED_FIELDS) {
        const name = assetName(item[field]);
        const source = path.join(assetRoot, name);
        if (!await exists(source)) throw new Error(`Missing required wardrobe asset: ${name}`);
        if (!copied.has(name)) {
          await copyFile(source, path.join(temporaryAssets, name));
          copied.add(name);
        }
        next[field] = `${STATIC_PREFIX}${name}`;
      }

      if (item.modeledImage) {
        const name = assetName(item.modeledImage);
        const source = path.join(assetRoot, name);
        if (await exists(source)) {
          if (!copied.has(name)) {
            await copyFile(source, path.join(temporaryAssets, name));
            copied.add(name);
          }
          next.modeledImage = `${STATIC_PREFIX}${name}`;
        } else {
          next.modeledImage = null;
        }
      }
      exported.push(next);
    }

    await writeFile(path.join(temporaryDir, "library.json"), `${JSON.stringify(exported, null, 2)}\n`);
    let outfitCount;
    let outfitAssetCount;
    if (outfitsPath && outfitImageRoot) {
      const manifest = JSON.parse(await readFile(outfitsPath, "utf8"));
      if (!Array.isArray(manifest.outfits)) throw new Error("Outfit manifest must contain an outfits array");
      const temporaryOutfits = path.join(temporaryDir, "outfits");
      const copiedOutfits = new Set();
      const outfits = [];

      for (const outfit of manifest.outfits.filter((candidate) => candidate?.status === "active")) {
        const next = { ...outfit };
        if (outfit.image) {
          const name = outfitImageName(outfit.image);
          const source = path.join(outfitImageRoot, name);
          if (await exists(source)) {
            await mkdir(temporaryOutfits, { recursive: true });
            if (!copiedOutfits.has(name)) {
              await copyFile(source, path.join(temporaryOutfits, name));
              copiedOutfits.add(name);
            }
            next.image = `${STATIC_OUTFIT_PREFIX}${name}`;
          } else {
            next.image = null;
          }
        } else {
          next.image = null;
        }
        outfits.push(next);
      }

      await writeFile(path.join(temporaryDir, "outfits.json"), `${JSON.stringify(outfits, null, 2)}\n`);
      outfitCount = outfits.length;
      outfitAssetCount = copiedOutfits.size;
    }
    await rm(outputDir, { recursive: true, force: true });
    await rename(temporaryDir, outputDir);
    return {
      itemCount: exported.length,
      assetCount: copied.size,
      ...(outfitCount === undefined ? {} : { outfitCount, outfitAssetCount }),
      outputDir,
    };
  } catch (error) {
    await rm(temporaryDir, { recursive: true, force: true });
    throw error;
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const projectRoot = process.cwd();
  const result = await exportStaticWardrobe({
    libraryPath: path.join(projectRoot, "data", "library.json"),
    assetRoot: path.join(projectRoot, "data", "imported"),
    outputDir: path.join(projectRoot, "public", "wardrobe"),
    outfitsPath: path.join(projectRoot, "data", "outfits.json"),
    outfitImageRoot: path.join(projectRoot, "data", "outfit-images"),
  });
  process.stdout.write(`Exported ${result.itemCount} items, ${result.assetCount} garment assets, ${result.outfitCount || 0} outfits, and ${result.outfitAssetCount || 0} outfit assets to ${result.outputDir}\n`);
}
