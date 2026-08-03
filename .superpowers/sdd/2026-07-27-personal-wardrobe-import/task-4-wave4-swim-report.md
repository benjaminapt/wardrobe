# Task 4, wave 4 batch C: swim and photo-graphic items

Built-in Imagegen was used in a distinct call for each slug. `black-square-photo-graphic-tee` required its one permitted regeneration because its initial output did not have sufficient lateral padding. The manifest was intentionally not changed.

## `dark-olive-elastic-waist-swim-shorts`

- Primary crop: `/private/tmp/wardrobe-import-benjamin-2022-2026/crops/dark-olive-elastic-waist-swim-shorts--primary.jpg`
- Generated chroma: `/private/tmp/wardrobe-import-benjamin-2022-2026/chroma/dark-olive-elastic-waist-swim-shorts.png`
- Final item: `/private/tmp/wardrobe-import-benjamin-2022-2026/items/dark-olive-elastic-waist-swim-shorts.png`
- Key background: requested `#ff00ff`; detected border key `#fa03f3`.
- Prompt: `Generate one complete empty front-view pair of dark olive swim shorts, source-faithful to the crop: dark olive smooth lightweight swim fabric, elastic waistband, knee-above short length, front center seam, and a dark olive center drawstring only as visibly supported. Center the complete front silhouette with generous padding on a perfectly uniform #ff00ff chroma background. No wearer, body, skin, hands, beach, water, sand, scene, mannequin, hanger, underlayer, lining, adjacent garments, props, floor, shadow, reflection, label, logo, watermark, or text. Omit all rear pockets and unsupported pocket layout, hardware, seam, trim, and branding.`
- Visual QA: compared against the primary crop. The output preserves the dark olive, elastic waist, drawstring, short swim silhouette, and source-supported front construction. It is complete, centered, and padded, with no body, water, beach, rear pocket, scene, shadow, reflection, mark, or chroma halo.
- Technical QA: PNG RGBA, 1402 × 1122; all four corner alpha values are `0`; alpha bounds `(151, 107, 1253, 1013)`, leaving padding of `(151, 107, 149, 109)` pixels.

## `black-square-photo-graphic-tee`

- Primary crop: `/private/tmp/wardrobe-import-benjamin-2022-2026/crops/black-square-photo-graphic-tee--primary.jpg`
- Generated chroma: `/private/tmp/wardrobe-import-benjamin-2022-2026/chroma/black-square-photo-graphic-tee.png`
- Final item: `/private/tmp/wardrobe-import-benjamin-2022-2026/items/black-square-photo-graphic-tee.png`
- Key background: requested `#00ff00`; detected border key `#04f906` on the accepted regeneration.
- Initial generation: rejected because the tee occupied almost the full width, leaving only 12-pixel lateral padding.
- Accepted prompt: `Generate one complete empty front-view black crewneck short-sleeve T-shirt, source-faithful to the crop: very dark navy-black lightweight knit, simple crewneck, standard short sleeves, relaxed straight body, straight hem, and one central pale off-white square photo print. Retain only the supported print visual, a pale circular record-like image with a small center circle and short barcode-like dark rectangle at lower right; omit unreadable microtext and uncertain photo detail. Center the whole tee with at least 15% empty green padding on each side and ample top and bottom padding, on a perfectly uniform #00ff00 chroma background. No beige shorts, person, skin, arms, sea, rocks, scene, mannequin, hanger, underlayer, adjacent garments, props, floor, shadow, reflection, label, logo, watermark, or extra text. Do not invent further graphic, text, logo, pocket, stitching, trim, or rear construction.`
- Visual QA: compared against the primary crop. The accepted output preserves the dark crewneck short-sleeve silhouette and central pale square record/photo graphic with only the source-supported barcode-like detail. It omits the wearer, beige shorts, sea, unreadable text, and unsupported print details. It is complete, centered, padded, with no body, scene, shadow, reflection, mark, or chroma halo.
- Technical QA: PNG RGBA, 1030 × 1526; all four corner alpha values are `0`; alpha bounds `(97, 353, 934, 1178)`, leaving padding of `(97, 353, 96, 348)` pixels.

## Chroma removal

Both chroma files were processed with `/Users/benjaminapt/.codex/skills/.system/imagegen/scripts/remove_chroma_key.py` using `--auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill --force`.

Both slugs passed final visual and technical QA. No manifest or other-slug asset was edited.
