import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { exportStaticWardrobe } from "./static-wardrobe-export.mjs";

async function fixture(items) {
  const root = await mkdtemp(path.join(os.tmpdir(), "wardrobe-static-export-"));
  const assetRoot = path.join(root, "assets");
  const outputDir = path.join(root, "output");
  const libraryPath = path.join(root, "library.json");
  await mkdir(assetRoot);
  await writeFile(libraryPath, `${JSON.stringify(items, null, 2)}\n`);
  return { root, assetRoot, outputDir, libraryPath };
}

test("rewrites accepted library URLs and copies each referenced asset once", async () => {
  const sourceUrl = "/api/import/library/item-garment.png";
  const paths = await fixture([{
    id: "item",
    image: sourceUrl,
    thumbnail: sourceUrl,
    modeledImage: "/api/import/library/item-modeled.png",
  }]);
  await writeFile(path.join(paths.assetRoot, "item-garment.png"), "garment");
  await writeFile(path.join(paths.assetRoot, "item-modeled.png"), "modeled");

  const result = await exportStaticWardrobe(paths);
  const exported = JSON.parse(await readFile(path.join(paths.outputDir, "library.json"), "utf8"));

  assert.deepEqual(result, { itemCount: 1, assetCount: 2, outputDir: paths.outputDir });
  assert.equal(exported[0].image, "/wardrobe/assets/item-garment.png");
  assert.equal(exported[0].thumbnail, "/wardrobe/assets/item-garment.png");
  assert.equal(exported[0].modeledImage, "/wardrobe/assets/item-modeled.png");
  assert.equal(await readFile(path.join(paths.outputDir, "assets", "item-garment.png"), "utf8"), "garment");
});

test("omits a missing optional modeled image without hiding the garment", async () => {
  const paths = await fixture([{
    id: "item",
    image: "/api/import/library/item-garment.png",
    thumbnail: "/api/import/library/item-garment.png",
    modeledImage: "/api/import/library/missing-modeled.png",
  }]);
  await writeFile(path.join(paths.assetRoot, "item-garment.png"), "garment");

  await exportStaticWardrobe(paths);
  const exported = JSON.parse(await readFile(path.join(paths.outputDir, "library.json"), "utf8"));

  assert.equal(exported[0].modeledImage, null);
  assert.equal(exported[0].image, "/wardrobe/assets/item-garment.png");
});

test("rejects a library whose required garment asset is missing", async () => {
  const paths = await fixture([{
    id: "item",
    image: "/api/import/library/missing-garment.png",
    thumbnail: "/api/import/library/missing-garment.png",
    modeledImage: null,
  }]);

  await assert.rejects(
    () => exportStaticWardrobe(paths),
    /Missing required wardrobe asset: missing-garment\.png/,
  );
});

test("rejects asset URLs outside the local wardrobe library", async () => {
  const paths = await fixture([{
    id: "item",
    image: "/api/import/library/../private/source.jpg",
    thumbnail: "/api/import/library/../private/source.jpg",
    modeledImage: null,
  }]);

  await assert.rejects(
    () => exportStaticWardrobe(paths),
    /Invalid wardrobe asset URL/,
  );
});

test("exports active outfits and rewrites their modeled image URLs", async () => {
  const paths = await fixture([{
    id: "item",
    image: "/api/import/library/item.png",
    thumbnail: "/api/import/library/item.png",
  }]);
  const outfitsPath = path.join(paths.root, "outfits.json");
  const outfitImageRoot = path.join(paths.root, "outfits");
  await writeFile(path.join(paths.assetRoot, "item.png"), "item");
  await mkdir(outfitImageRoot);
  await writeFile(outfitsPath, JSON.stringify({
    outfits: [
      { id: "look", status: "active", image: "/api/import/outfits/look.png" },
      { id: "draft", status: "planned", image: "/api/import/outfits/draft.png" },
    ],
  }));
  await writeFile(path.join(outfitImageRoot, "look.png"), "look");

  await exportStaticWardrobe({ ...paths, outfitsPath, outfitImageRoot });

  assert.deepEqual(JSON.parse(await readFile(path.join(paths.outputDir, "outfits.json"), "utf8")), [
    { id: "look", status: "active", image: "/wardrobe/outfits/look.png" },
  ]);
  assert.equal(await readFile(path.join(paths.outputDir, "outfits", "look.png"), "utf8"), "look");
});

test("preserves an active outfit with a missing image and rejects escaped outfit paths", async () => {
  const paths = await fixture([{
    id: "item",
    image: "/api/import/library/item.png",
    thumbnail: "/api/import/library/item.png",
  }]);
  const outfitsPath = path.join(paths.root, "outfits.json");
  const outfitImageRoot = path.join(paths.root, "outfits");
  await writeFile(path.join(paths.assetRoot, "item.png"), "item");
  await mkdir(outfitImageRoot);
  await writeFile(outfitsPath, JSON.stringify({
    outfits: [{ id: "missing", status: "active", image: "/api/import/outfits/missing.png" }],
  }));

  await exportStaticWardrobe({ ...paths, outfitsPath, outfitImageRoot });
  assert.equal(JSON.parse(await readFile(path.join(paths.outputDir, "outfits.json"), "utf8"))[0].image, null);

  await writeFile(outfitsPath, JSON.stringify({
    outfits: [{ id: "unsafe", status: "active", image: "/api/import/outfits/../private.png" }],
  }));
  await assert.rejects(
    () => exportStaticWardrobe({ ...paths, outfitsPath, outfitImageRoot }),
    /Invalid outfit image URL/,
  );
});
