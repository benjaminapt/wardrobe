# Personal Wardrobe Import

- **Purpose:** Initial import of personal wardrobe from photos to local database, verifying deterministic import pipeline.
- **Date Range:** 2022-01-01 through 2026-07-27.
- **Item Counts:** 64 items accepted and imported. 35 items held for insufficient evidence.
- **Database Path:** `/Users/benjaminapt/Documents/Wardrobe/data/library.json`
- **Privacy:** Original personal photos remain strictly local. Accepted cutouts and modeled references stay ignored by Git; a static copy of only the 64 accepted catalog assets is present in the protected Vercel preview.
- **Remaining Gaps:** The modeled image generation hit an API rate limit (Gemini Quota Exhausted). Only 6 out of 64 items received modeled photos. The remaining 58 items were imported as cutout-only (`modeledFile: null`).
- **Next Recommended Step:** Wait 5 hours for the image generation API quota to reset, then resume generating modeled photos for the remaining 58 items using the stable deterministic importer to update the records without duplication.

## Private Vercel Preview

- **Project:** `benjaminaptc-4943s-projects/wardrobe-private`
- **Protected URL:** `https://wardrobe-private-4nmpxbrcg-benjaminaptc-4943s-projects.vercel.app`
- **Environment:** Preview, protected by Vercel Authentication. Anonymous requests redirect to Vercel login.
- **Contents:** 64 accepted items, 70 referenced derived assets, 6 modeled images, and no original gallery photos.
- **Git boundary:** `data/`, `public/wardrobe/`, and `.vercel/` are ignored. Private catalog assets are uploaded only through a local prebuilt deployment.
- **Hosted behavior:** Read-only snapshot. Import controls and local filesystem mutations are disabled in the static build.
- **Validation:** Authenticated root, library JSON, and representative image return `200`; local static UI renders 64 cards with no broken images.
- **Removed deployment:** The accidental initial production deployment was deleted; only the protected preview remains.

Refresh after changing the local library:

```bash
npm run test:static-export
node --test src/wardrobe-source.test.js
vercel pull --yes --environment preview
vercel build --yes
vercel deploy --prebuilt --target preview
```

## Session Handoff (2026-07-31)

- **Current branch:** `main`, synchronized with `origin/main` through `91f11a3` before this handoff update.
- **Hosted app:** The protected preview above is the only remaining Vercel deployment; the accidental public production deployment was removed.
- **Vercel gotcha:** For a new project, `vercel deploy --prebuilt` created the first deployment as production. Always pass `--target preview`, then verify anonymous access returns `302` to `vercel.com/sso-api` before sharing the URL.
- **Validation baseline:** Both Node test files pass, local and static Vite builds pass, the static artifact contains 64 items and 70 derived assets, and the hosted library returns 64 items through authenticated `vercel curl`.
- **Antigravity tracked changes:** `index.html`, `src/import-flow.css`, and `src/styles.css` contain an uncommitted dark-theme redesign (114 additions, 68 deletions). It is included in the current Vercel artifact but has not been reviewed or committed.
- **Other untracked work:** `.Rhistory`, `.superpowers/`, `combine.py`, `combined_garments.png`, `compose_clothes.py`, `composite_images.py`, `concat.py`, `generate_prompts.js`, `generate_prompts.mjs`, `process_final_outfit.mjs`, `process_outfits.mjs`, and `prompts.json` predate this handoff. Do not commit or delete them as a group without identifying their owner and purpose.
- **Next session priority:** Review the three Antigravity UI files visually and technically, decide whether to commit or revise them, then inventory the untracked utilities. After that, resume modeled-image generation for the remaining 58 items if desired.
- **Privacy boundary:** Keep `data/`, `public/wardrobe/`, and `.vercel/` ignored. Never connect a remote Git build that expects the private static snapshot; refresh via local `vercel build --yes` and `vercel deploy --prebuilt --target preview`.

## Dark-theme review and publish (2026-07-31)

- **Reviewed scope:** Antigravity's dark-theme redesign in `index.html`, `src/styles.css`, and `src/import-flow.css`.
- **Corrections:** The selected import card now uses the theme accent instead of a nearly white background, and import success/error states use accessible dark-theme colors. Trailing whitespace was removed.
- **Validation:** Static-export tests (4), wardrobe-source tests (4), and both Vite builds pass. The static artifact still contains 64 items and 70 derived assets.
- **Excluded local artifacts:** `.Rhistory`, `.superpowers/`, image-composition scripts, generated prompt files, and `combined_garments.png` remain untracked. They depend on private library data and absolute local paths; they are not app release files.

## Outfits and manual theme control (2026-07-31)

- **Lookbook:** The app now reads the 10 active records in `data/outfits.json` locally and renders them in an Outfits view. The static exporter copies their modeled images into the protected snapshot as `/wardrobe/outfits/` paths; all outfit source images remain ignored by Git.
- **Theme:** The header has a day/night control. A manual choice persists in `open-wardrobe-theme-v1`; only a first-time visit follows the operating-system preference.
- **Validation:** Theme (4), outfit source (3), Vite plugin order (1), wardrobe source (4), and static exporter (6) tests cover the new boundaries. Local API verification returns 10 active outfits and a representative modeled PNG with `200 image/png`.
- **Release procedure:** Merge the approved branch into `main`, then create a fresh protected preview with `vercel build --yes` and `vercel deploy --prebuilt --target preview`.

## Gallery audit import (2026-08-01)

- **Scope correction:** The prior 39-image batch was only an initial selected export. The Photos person album contains 2,952 photos and 34 videos; ongoing discovery uses read-only access to local Photos derivatives and metadata, without controlling Photos.app.
- **New accepted pieces:** `Grey Chunky-Knit High-Neck`, `Blue Textured Suit Trousers`, and `Black Kappa Logo Tee`. Each has a source-faithful transparent cutout and a verified modeled photo.
- **Catalog state:** 67 accepted items. The protected static snapshot was regenerated with 67 items, 76 wardrobe assets, and 10 outfits.
- **Evidence policy:** Keep candidate garments on hold if the gallery does not distinguish their construction from a duplicate or cannot support a faithful reconstruction. Older gallery photos are visual evidence, not automatic proof that the item is still owned.

## Curated lookbook expansion (2026-08-01)

- **Collection:** Expanded from 10 to 30 active modeled looks. The added 20 are curated across tailoring, smart-casual, cool-weather, street, and warm-weather use, with no duplicate garment combinations.
- **Quality gate:** Every new image was generated against the model reference and exact local cutouts, then visually checked for identity, full-body framing, recognizable selected garments, and material/logo fidelity. A first charcoal-knit render was rejected and regenerated to preserve the oversized chunky knit texture.
- **Published snapshot:** Protected preview `https://wardrobe-private-d09u14ini-benjaminaptc-4943s-projects.vercel.app` has 67 items, 76 wardrobe assets, 30 active outfits, and 30 modeled outfit images. Authenticated Vercel checks returned `200` for the library, the outfit manifest, and a representative new look image.

## Continued gallery import (2026-08-01)

- **New accepted pieces:** `White Levi's Batwing Tee` and `Beige Sleeveless Muscle Tank`, based on clearly visible 2025 gallery sources. The tank's tiny unreadable wordmark was deliberately omitted instead of invented.
- **New looks:** `Levi's Black Cargo` and `Beige Tank Olive Swim`; both were generated from the selected garment cutouts and visually checked before publishing.
- **Catalog state:** 69 accepted items, 80 wardrobe assets, 32 active outfits, and 32 modeled outfit images.
- **Published snapshot:** Protected preview `https://wardrobe-private-3d5k3q1cg-benjaminaptc-4943s-projects.vercel.app`. Authenticated Vercel checks returned `200` for the library JSON, outfit JSON, and `levis-black-cargo.png`.
- **Open curation:** Audits identified a well-visible red/white Adidas football jersey and several hoodies as possible further pieces, but none were added until their cutout/model fidelity can be checked against the sources.

## Red football jersey release (2026-08-01)

- **New accepted piece:** `Red and White Adidas Football Jersey`, reconstructed only from the visible red pinstripes, white shoulder panels, three sleeve stripes, V-neck, chest crest, and gold star. No source-unreadable sponsor or lettering was invented.
- **New look:** `Red Pinstripe Matchday`, pairing the jersey with existing black cargo trousers and black-and-white skate sneakers.
- **Catalog state:** 70 accepted items, 82 wardrobe assets, 33 active outfits, and 33 modeled outfit images.
- **Published snapshot:** Protected preview `https://wardrobe-private-pvruo1b11-benjaminaptc-4943s-projects.vercel.app`. Authenticated checks verified exactly 70 garments and 33 outfits, including `red-pinstripe-matchday`.

## Curated gallery wave (2026-08-01)

- **New accepted pieces:** `Black Orange-Pocket Parka`, `Black Fuchsia Colo-Colo Jersey`, and `Grey Zip Hoodie`. Each came from a read-only gallery audit, then an evidence-bound transparent cutout and modeled reference. Text, sponsors, and labels not established by the photos were omitted.
- **New looks:** `Black Orange Parka Cargo`, `Black Fuchsia Colo Matchday`, and `Grey Zip Hoodie Light Cargo`. Each uses the new item with existing wardrobe references and passed a full head-to-shoe visual QA.
- **Catalog state:** 73 accepted items, 88 wardrobe assets, 36 active outfits, and 36 modeled outfit images.
- **Published snapshot:** Protected preview `https://wardrobe-private-dqudsrkfk-benjaminaptc-4943s-projects.vercel.app`. Authenticated checks verified 73 garments, 36 outfits, and `black-orange-parka-cargo.png` with `200 image/png`.
- **Held candidates:** the light beige graphic tank, navy graphic tee, taupe crewneck, and olive/beige jacket remain held because they would require guessing text, a duplicate decision, or unseen construction.

## Gallery depth wave (2026-08-02)

- **Audit scope:** Read-only parallel reviews covered 415 prioritized person-photo derivatives across 2022, early 2023, and 2024, contrasted against the 73-item catalog at the time. Photos.app and original assets were never modified.
- **New accepted pieces:** `Light Grey Windowpane Blazer`, `Black Pullover Kangaroo Hoodie`, `White Vasco Kappa Track Jacket`, `Rust Pocket Tee`, and `Czech Adidas Lace Jersey`. Each has an RGBA cutout plus an identity-preserving modeled reference. Unreadable sponsor text, labels, and faint graphics were omitted.
- **New looks:** `Windowpane Navy Tailoring`, `Black Hoodie Light Cargo`, `Vasco Track Black Cargo`, `Rust Pocket Light Cargo`, and `Czech Retro Black Cargo`. Each passed full head-to-shoes review with all selected pieces visible and recognizable.
- **Catalog state:** 78 accepted items, 98 wardrobe assets, 41 active outfits, and 41 modeled outfit images.
- **Published snapshot:** Protected preview `https://wardrobe-private-gx30ifztw-benjaminaptc-4943s-projects.vercel.app`. Authenticated checks verified 78 garments, 41 outfits, and `windowpane-navy-tailoring.png` with `200 image/png`.
- **Further holds:** Outerwear or sport pieces with unseen hems, pockets, logos, or graphics remain excluded until a source supports a faithful reconstruction.

## Late gallery essentials wave (2026-08-02)

- **Audit scope:** Read-only parallel review covered 468 prioritized person-photo derivatives from late 2023 and 2025. The review contrasted candidates with the existing 78-item catalog; Photos.app and every source asset remained untouched.
- **New accepted pieces:** \`Black Elephant Crest Tank\`, \`Black Deep-Armhole Tank\`, \`Black Open-Collar Polo\`, \`White Dark-Rib Tank\`, and \`Washed Blue Nike Tee\`. Each has a clean RGBA cutout and identity-preserving modeled reference.
- **Evidence guard:** The white tank's unreadable chest mark was removed entirely after central QA. Crest-internal lettering, hidden polo fasteners, and any other unsupported text or construction are deliberately omitted.
- **Catalog state:** 83 accepted items, 108 wardrobe assets, 41 active outfits, and 41 modeled outfit images.
- **Outfit curation:** No additional arbitrary outfit count was generated in this wave. The existing lookbook remains at 41 curated looks; future look generation will use a user-specified count, not exhaustive combinations.
