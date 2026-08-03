# Task 4, wave 4 batch B: stone tee and light-blue cargo jeans

Built-in Imagegen was used once per slug. No regeneration was needed, and the manifest was intentionally not changed.

## `stone-washed-crewneck-tee`

- Source inspected: `/private/tmp/wardrobe-import-benjamin-2022-2026/crops/stone-washed-crewneck-tee--primary.jpg`
- Generated chroma: `/private/tmp/wardrobe-import-benjamin-2022-2026/chroma/stone-washed-crewneck-tee.png`
- Final transparent cutout: `/private/tmp/wardrobe-import-benjamin-2022-2026/items/stone-washed-crewneck-tee.png`
- Prompt: `Generate one complete, empty stone/tan washed crewneck short-sleeve T-shirt with the source-supported pale stone/tan lightweight washed texture, simple ribbed crew neckline, short sleeves, relaxed straight silhouette, and plain unbranded front. Center it with generous padding on perfectly uniform #ff00ff chroma. No jacket, bottle, body, skin, mannequin, hanger, underlayer, adjacent item, scene, prop, floor, shadow, reflection, mark, logo, text, pocket, or graphic. Omit rear markings, rear construction, obscured hem details, interior details, and unsupported seams or trim.`
- Deterministic QA: PNG/RGBA, 1387x1134; all four corner alpha values are 0; alpha bounds leave 50px left, 56px top, 52px right, and 62px bottom padding; 712,843 fully transparent, 4,625 antialiased, and 855,390 fully opaque pixels.
- Visual QA: the final item is a complete, centered, clean pale stone/tan washed crewneck with short sleeves and a plain front. It has no body, jacket, bottle, other garment, shadow, clipping, halo, mark, or unsupported rear detail.

## `light-blue-double-pocket-cargo-jeans`

- Sources inspected: `/private/tmp/wardrobe-import-benjamin-2022-2026/crops/light-blue-double-pocket-cargo-jeans--primary.jpg` and `/private/tmp/wardrobe-import-benjamin-2022-2026/source-jpg/037-IMG_7748.jpg`
- Generated chroma: `/private/tmp/wardrobe-import-benjamin-2022-2026/chroma/light-blue-double-pocket-cargo-jeans.png`
- Final transparent cutout: `/private/tmp/wardrobe-import-benjamin-2022-2026/items/light-blue-double-pocket-cargo-jeans.png`
- Prompt: `Generate one complete, empty pair of light-blue relaxed cargo jeans: faded pale blue denim; conventional belt-loop waistband and front fly; wide straight legs; and two stacked rectangular flap cargo pockets on each outer leg, with source-supported dark edge/topstitching. Center the full front view with generous padding on perfectly uniform #ff00ff chroma. No jacket, tee, person, body, shoes, mannequin, hanger, underlayer, adjacent item, scene, prop, floor, shadow, reflection, label, mark, logo, or text. Omit rear pockets, rear construction, labels, interior detail, unseen hardware, and any extra cargo pockets, zips, straps, rips, embroidery, or unsupported seams.`
- Deterministic QA: PNG/RGBA, 1023x1537; all four corner alpha values are 0; alpha bounds leave 201px left, 102px top, 217px right, and 92px bottom padding; 920,711 fully transparent, 378 antialiased, and 651,262 fully opaque pixels.
- Visual QA: the final item keeps the faded light-blue denim, broad straight fit, conventional front jeans construction, and two externally visible flap utility pockets per leg. The chroma matte was tightened once with `--edge-contract 1`, removing the thin magenta fringe without altering the garment. It has no jacket, tee, person, shoes, underlayer, scene, shadow, clipping, invented rear detail, mark, or logo.

## Processing

Both chroma files were processed with `/Users/benjaminapt/.codex/skills/.system/imagegen/scripts/remove_chroma_key.py`, using `--auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill --force`; the jeans additionally used `--edge-contract 1` after visual inspection found a thin chroma fringe. Deterministic alpha validation was completed with Pillow because the workspace does not have the plan's `sharp` dependency installed.
