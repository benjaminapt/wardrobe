# Task 4, wave 3 batch A: blue suit items

Built-in Imagegen was used once per slug. No regeneration was needed. The manifest was intentionally not changed.

## `blue-textured-two-button-suit-jacket`

- Reference inspected: `/private/tmp/wardrobe-import-benjamin-2022-2026/crops/blue-textured-two-button-suit-jacket--primary.jpg`
- Generated chroma: `/private/tmp/wardrobe-import-benjamin-2022-2026/chroma/blue-textured-two-button-suit-jacket.png`
- Final cutout: `/private/tmp/wardrobe-import-benjamin-2022-2026/items/blue-textured-two-button-suit-jacket.png`
- Attempts: 1 (accepted)
- Prompt: `Generate one complete, empty, front-view tailored suit jacket, isolated and source-faithful: medium blue fine diagonal textured weave, notch lapels, welt chest pocket, two dark front buttons, two flap hip pockets, four dark cuff buttons, tailored single-breasted silhouette, long sleeves, and straight hem. Center the complete jacket with generous padding on a perfectly uniform #00ff00 chroma background. No tee, body, skin, trousers, hand, phone, mannequin, hanger, underlayer, adjacent item, scene, prop, floor, shadow, reflection, label, watermark, or text. Omit rear vents, lining, labels, and unseen interior construction. Do not add logos or unsupported piping, seams, buttons, or pockets.`
- Deterministic QA: PNG/RGBA, 1057x1488; all four corner alpha values are 0; alpha bounds leave 89px left, 102px top, 94px right, and 141px bottom padding; 639,163 fully transparent, 5,635 antialiased, and 928,018 fully opaque pixels.
- Visual QA: compared directly against the primary crop. The output preserves blue textured tailored fabric, notch lapels, chest welt pocket, two-button front, flap pockets, and four-button cuffs. It is complete, centered, padded, with no clipped extremity, body/tee/phone/prop, chroma halo, cast shadow, rear/lining view, mark, or invented logo.

## `off-white-slub-crewneck-tee`

- Reference inspected: `/private/tmp/wardrobe-import-benjamin-2022-2026/crops/off-white-slub-crewneck-tee--primary.jpg`
- Generated chroma: `/private/tmp/wardrobe-import-benjamin-2022-2026/chroma/off-white-slub-crewneck-tee.png`
- Final cutout: `/private/tmp/wardrobe-import-benjamin-2022-2026/items/off-white-slub-crewneck-tee.png`
- Attempts: 1 (accepted)
- Prompt: `Generate one complete, empty, front-view short-sleeve crewneck T-shirt, isolated and source-faithful: plain off-white lightweight T-shirt with subtle irregular slub texture, simple crew neckline, standard short sleeves, relaxed straight body, straight hem, and unbranded plain front. Center the complete tee with generous padding on a perfectly uniform #00ff00 chroma background. No jacket, body, skin, trousers, hand, phone, mannequin, hanger, underlayer, adjacent item, scene, prop, floor, shadow, reflection, label, watermark, graphic, pocket, or text. Omit rear construction, jacket-hidden sleeve details, unseen seams, and interior details. Do not add logos, graphics, pockets, tags, unsupported stitching, or trim.`
- Deterministic QA: PNG/RGBA, 1023x1537; all four corner alpha values are 0; alpha bounds leave 36px left, 188px top, 38px right, and 196px bottom padding; 837,922 fully transparent, 4,726 antialiased, and 729,703 fully opaque pixels.
- Visual QA: compared directly against the primary crop. The output preserves the off-white lightweight slub texture, plain crewneck, plain short sleeves, relaxed straight body, and plain front. It is complete, centered, padded, with no clipped extremity, jacket/body/phone/prop, chroma halo, cast shadow, invented pocket/graphic, rear detail, or mark.

## Cleanup

Both chroma files were processed with `/Users/benjaminapt/.codex/skills/.system/imagegen/scripts/remove_chroma_key.py` using the required `--auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill --force` parameters. The detected border keys were `#05f902` (jacket) and `#02f902` (tee), consistent with the requested flat green background.
