# Personal Wardrobe Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Benjamín's local Wardrobe gallery from high-confidence, currently owned garments visible in Photos between 2022-01-01 and 2026-07-27.

**Architecture:** Use macOS Photos only for read-only source selection, export a curated set into a private temporary workspace, and follow the repository's `import-clothes` workflow to inventory, deduplicate, generate, QA, and import garments. Keep all personal media and generated assets outside Git; only operational documentation is tracked.

**Tech Stack:** macOS Photos, Codex Computer Use, Codex Imagegen via ChatGPT OAuth, Node.js 22+, Vite 6, React 19, Sharp, Python 3 with Pillow, and the repository's deterministic importer.

## Global Constraints

- Photos person: `Benjamín`.
- Date range: `2022-01-01` through `2026-07-27`, inclusive.
- Target shortlist: approximately 40 to 80 photos, stopping when additional images reveal no new garments or construction evidence.
- Use images only; videos are excluded from the first pass.
- Never modify, delete, tag, favorite, or reorganize the Photos library.
- Never track source photos, the identity reference, temporary crops, prompts, manifests, QA sheets, or generated personal assets in Git.
- Use the current ChatGPT-authenticated Codex session; do not add `OPENAI_API_KEY`.
- Preserve only source-supported garment details and hold uncertain items rather than inventing them.
- Present the deduplicated candidate inventory to Benjamín before generation.
- Use only `upperbody`, `wholebody_up`, `lowerbody`, `accessories_up`, or `shoes` as Wardrobe `part` values.
- Keep all temporary work under `/private/tmp/wardrobe-import-benjamin-2022-2026`.
- Do not remove the temporary workspace until delivery and gallery verification succeed.

## File Structure

### Tracked files

- Existing: `.agents/skills/import-clothes/SKILL.md` — authoritative import workflow.
- Existing: `.agents/skills/import-clothes/scripts/import-to-wardrobe.mjs` — deterministic validator and importer.
- Existing: `.gitignore` — excludes the complete `data/` tree.
- Create: `CLAUDE.md` — concise operational record of completed work, held items, and the next step.
- Existing: `docs/superpowers/specs/2026-07-27-personal-wardrobe-import-design.md` — approved design.
- Create: `docs/superpowers/plans/2026-07-27-personal-wardrobe-import.md` — this execution plan.

### Private, ignored, or temporary files

- `/private/tmp/wardrobe-import-benjamin-2022-2026/source-originals/` — unchanged Photos exports.
- `/private/tmp/wardrobe-import-benjamin-2022-2026/source-jpg/` — upright RGB JPEG working copies.
- `/private/tmp/wardrobe-import-benjamin-2022-2026/crops/` — focused garment references.
- `/private/tmp/wardrobe-import-benjamin-2022-2026/chroma/` — generated garments on chroma backgrounds.
- `/private/tmp/wardrobe-import-benjamin-2022-2026/items/` — transparent garment PNGs.
- `/private/tmp/wardrobe-import-benjamin-2022-2026/modeled/` — modeled editorial PNGs.
- `/private/tmp/wardrobe-import-benjamin-2022-2026/qa/` — labeled contact sheets and validation images.
- `/private/tmp/wardrobe-import-benjamin-2022-2026/manifest.json` — inventory and acceptance state.
- `data/model-reference.png` — approved identity reference.
- `data/library.json` — local Wardrobe database.
- `data/imported/*.png` — imported garment and modeled images.

---

### Task 1: Establish a Verified Private Baseline

**Files:**
- Verify: `package.json`
- Verify: `.gitignore`
- Verify: `scripts/import-job-api.mjs`
- Verify: `.agents/skills/import-clothes/SKILL.md`
- Create privately: `/private/tmp/wardrobe-import-benjamin-2022-2026/`

**Interfaces:**
- Consumes: the cloned `tandpfun/wardrobe` repository.
- Produces: a buildable repository and the complete private workspace directory structure used by every later task.

- [ ] **Step 1: Verify the repository identity and privacy boundary**

Run:

```bash
test "$(node -p "require('./package.json').name")" = "wardrobe"
test -f scripts/import-job-api.mjs
rg -n '^data/$' .gitignore
```

Expected: both `test` commands exit `0`; `rg` prints `data/`.

- [ ] **Step 2: Install the locked dependencies**

Run:

```bash
npm install
```

Expected: exit `0` with no change to the dependency manifest.

- [ ] **Step 3: Verify the untouched application baseline**

Run:

```bash
npm run check
```

Expected: Vite completes a production build and exits `0`.

- [ ] **Step 4: Create the private workspace**

Run:

```bash
mkdir -p /private/tmp/wardrobe-import-benjamin-2022-2026/{source-originals,source-jpg,crops,chroma,items,modeled,qa}
```

Expected: all seven child directories exist.

- [ ] **Step 5: Verify the worktree contains no personal media**

Run:

```bash
git status --short
git ls-files data
```

Expected: `git ls-files data` prints nothing. The status may show only this tracked plan before it is committed.

- [ ] **Step 6: Verify the approved design and plan are committed**

Run:

```bash
git log --oneline -- \
  docs/superpowers/specs/2026-07-27-personal-wardrobe-import-design.md \
  docs/superpowers/plans/2026-07-27-personal-wardrobe-import.md
```

Expected: committed documentation history for both the approved design and this implementation plan.

---

### Task 2: Curate and Export the 2022–2026 Source Set

**Files:**
- Create privately: `/private/tmp/wardrobe-import-benjamin-2022-2026/source-originals/*`

**Interfaces:**
- Consumes: macOS Photos person `Benjamín`, date range `2022-01-01` through `2026-07-27`.
- Produces: 40–80 unchanged image exports with enough visual evidence to inventory garments.

- [ ] **Step 1: Read the Computer Use instructions before operating Photos**

Read completely:

```text
/Users/benjaminapt/.codex/plugins/cache/openai-bundled/computer-use/1.0.1000502/skills/computer-use/SKILL.md
```

Expected: all Photos interactions use `node_repl` and refresh app state after actions.

- [ ] **Step 2: Open the correct Photos person**

In Photos, navigate to `Personas` and open `Benjamín`, whose library reports approximately `2.952 fotos, 35 videos` through July 2026.

Expected: the window title is `Benjamín`, not `Benja`.

- [ ] **Step 3: Review 2026 backward through 2022**

Use the `Todo` view and review images year by year. Prefer clear full-body or half-body views and complementary angles. Exclude videos, screenshots, documents, blur, and group photos where Benjamín or the garment is ambiguous.

Expected: selection is limited to useful wardrobe evidence and remains within the approved date range.

- [ ] **Step 4: Stop selecting when marginal photos add no evidence**

Target 40–80 selected images, but stop earlier if additional images reveal no new garments or construction detail. Include more than one photo of a garment only when the second image establishes a different side or defining feature.

Expected: the selection is evidence-rich rather than quota-driven.

- [ ] **Step 5: Export unchanged copies**

Use Photos menu `Archivo > Exportar > Exportar original sin modificar` and choose:

```text
/private/tmp/wardrobe-import-benjamin-2022-2026/source-originals
```

Keep original filenames and metadata. Do not delete or alter the Photos selection afterward.

Expected: exports appear in `source-originals/`; the Photos library remains unchanged.

- [ ] **Step 6: Verify export count and media types**

Run:

```bash
rg --files /private/tmp/wardrobe-import-benjamin-2022-2026/source-originals \
  | rg -i '\.(jpe?g|png|webp|heic|heif|tiff?|bmp|avif)$' \
  | wc -l
rg --files /private/tmp/wardrobe-import-benjamin-2022-2026/source-originals \
  | rg -i '\.(mov|mp4|m4v)$' || true
```

Expected: the image count reflects the curated set; the second command prints nothing.

---

### Task 3: Normalize Sources and Build the Candidate Inventory

**Files:**
- Create privately: `/private/tmp/wardrobe-import-benjamin-2022-2026/source-jpg/*.jpg`
- Create privately: `/private/tmp/wardrobe-import-benjamin-2022-2026/qa/sources-*.jpg`
- Create privately: `/private/tmp/wardrobe-import-benjamin-2022-2026/manifest.json`

**Interfaces:**
- Consumes: unchanged exports from Task 2.
- Produces: upright working copies, source contact sheets, and a deduplicated candidate manifest with `candidate` or `hold` statuses.

- [ ] **Step 1: Inventory all exported source images**

Run:

```bash
rg --files /private/tmp/wardrobe-import-benjamin-2022-2026/source-originals \
  -g '*.{jpg,jpeg,png,webp,heic,heif,tif,tiff,bmp,avif}' \
  -g '*.{JPG,JPEG,PNG,WEBP,HEIC,HEIF,TIF,TIFF,BMP,AVIF}'
```

Expected: every selected source image appears exactly once.

- [ ] **Step 2: Create upright RGB JPEG working copies**

Use Pillow to apply EXIF orientation, convert to RGB, preserve the original pixel dimensions, and save JPEG quality `95` without upscaling. Each output basename must be unique and traceable to its source.

Run:

```bash
python3 - <<'PY'
from pathlib import Path
import subprocess
from PIL import Image, ImageOps

source = Path("/private/tmp/wardrobe-import-benjamin-2022-2026/source-originals")
target = Path("/private/tmp/wardrobe-import-benjamin-2022-2026/source-jpg")
target.mkdir(parents=True, exist_ok=True)
extensions = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".tif", ".tiff", ".bmp", ".avif"}
files = sorted(path for path in source.iterdir() if path.is_file() and path.suffix.lower() in extensions)

for index, path in enumerate(files, start=1):
    output = target / f"{index:03d}-{path.stem}.jpg"
    try:
        opened = Image.open(path)
    except Exception:
        subprocess.run(
            ["sips", "-s", "format", "jpeg", "-s", "formatOptions", "95", str(path), "--out", str(output)],
            check=True,
            capture_output=True,
        )
        opened = Image.open(output)
    with opened:
        image = ImageOps.exif_transpose(opened).convert("RGB")
        image.save(output, "JPEG", quality=95, subsampling=0, optimize=True)

print(f"normalized={len(files)}")
PY
```

Expected: `source-jpg/` contains one readable JPEG per supported source image and no source file is modified.

- [ ] **Step 3: Create labeled source contact sheets**

Use Pillow to create sheets of at most 12 images, each thumbnail fitted inside a `420×420` cell with the source basename rendered below it. Save JPEG quality `92` as:

```text
/private/tmp/wardrobe-import-benjamin-2022-2026/qa/sources-01.jpg
/private/tmp/wardrobe-import-benjamin-2022-2026/qa/sources-02.jpg
```

Continue the sequence until every working image appears once.

Run:

```bash
python3 - <<'PY'
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

source = Path("/private/tmp/wardrobe-import-benjamin-2022-2026/source-jpg")
target = Path("/private/tmp/wardrobe-import-benjamin-2022-2026/qa")
target.mkdir(parents=True, exist_ok=True)
files = sorted(source.glob("*.jpg"))
font = ImageFont.load_default(size=18)
cell_width, image_height, label_height = 420, 420, 36
columns, rows = 3, 4

for sheet_index, start in enumerate(range(0, len(files), columns * rows), start=1):
    batch = files[start:start + columns * rows]
    sheet = Image.new("RGB", (columns * cell_width, rows * (image_height + label_height)), "white")
    draw = ImageDraw.Draw(sheet)
    for slot, path in enumerate(batch):
        with Image.open(path) as opened:
            thumb = ImageOps.contain(opened.convert("RGB"), (cell_width - 16, image_height - 16))
        column, row = slot % columns, slot // columns
        x = column * cell_width + (cell_width - thumb.width) // 2
        y = row * (image_height + label_height) + (image_height - thumb.height) // 2
        sheet.paste(thumb, (x, y))
        draw.text((column * cell_width + 8, row * (image_height + label_height) + image_height + 6), path.name, fill="black", font=font)
    sheet.save(target / f"sources-{sheet_index:02d}.jpg", "JPEG", quality=92, optimize=True)

print(f"sheets={(len(files) + 11) // 12}, images={len(files)}")
PY
```

Expected: every sheet contains no more than 12 labeled images and every source is represented.

- [ ] **Step 4: Inspect every contact sheet and build the physical-item inventory**

Record every deliberately worn top, jacket, bottom, accessory, and established shoe pair. Merge appearances only when the photos establish the same physical item. Put irrecoverable or ambiguous items on hold.

Expected: one inventory record per physical item, with all useful `sourceRefs` attached.

- [ ] **Step 5: Write the candidate manifest**

Create `/private/tmp/wardrobe-import-benjamin-2022-2026/manifest.json` with:

```json
{
  "items": [
    {
      "slug": "navy-zip-cardigan",
      "file": "navy-zip-cardigan.png",
      "modeledFile": "navy-zip-cardigan.png",
      "name": "Navy Zip Cardigan",
      "part": "wholebody_up",
      "color": "#172033",
      "secondaryColor": null,
      "tags": ["navy", "knit", "zip"],
      "status": "candidate",
      "sourceRefs": ["IMG_1234.jpg"],
      "unknowns": ["rear construction not visible"]
    }
  ]
}
```

Use lowercase hyphenated slugs, six-digit hex colors, no more than 12 short lowercase tags, and only the approved `part` values.

- [ ] **Step 6: Validate manifest structure**

Run:

```bash
node --input-type=module -e '
import { readFileSync } from "node:fs";
const file = "/private/tmp/wardrobe-import-benjamin-2022-2026/manifest.json";
const data = JSON.parse(readFileSync(file, "utf8"));
const parts = new Set(["upperbody","wholebody_up","lowerbody","accessories_up","shoes"]);
if (!Array.isArray(data.items) || !data.items.length) throw new Error("No candidate items");
for (const item of data.items) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)) throw new Error(`Bad slug: ${item.slug}`);
  if (!parts.has(item.part)) throw new Error(`Bad part: ${item.slug}`);
  if (!/^#[0-9a-f]{6}$/i.test(item.color)) throw new Error(`Bad color: ${item.slug}`);
  if (!["candidate","hold"].includes(item.status)) throw new Error(`Bad status: ${item.slug}`);
  if (!Array.isArray(item.sourceRefs) || !item.sourceRefs.length) throw new Error(`No sources: ${item.slug}`);
}
console.log(JSON.stringify({ candidates: data.items.filter(x => x.status === "candidate").length, held: data.items.filter(x => x.status === "hold").length }));
'
```

Expected: one JSON summary with nonzero candidates and no exception.

- [ ] **Step 7: Present the inventory for current-ownership review**

Show Benjamín the candidate names, categories, identifying details, and held items. Ask him to remove garments he no longer owns and resolve questionable duplicates. Also present 2–3 clear recent identity-reference candidates.

Expected: Benjamín explicitly approves the garments that advance and selects one identity reference.

- [ ] **Step 8: Apply the ownership decision**

Change approved current garments to `status: "generate"`, rejected garments to `status: "rejected"`, and unresolved garments to `status: "hold"`. Export the selected identity reference as a PNG to `data/model-reference.png`.

Expected: no `candidate` statuses remain; `data/model-reference.png` is ignored by Git.

---

### Task 4: Generate and Verify Transparent Garment Cutouts

**Files:**
- Create privately: `/private/tmp/wardrobe-import-benjamin-2022-2026/crops/*.jpg`
- Create privately: `/private/tmp/wardrobe-import-benjamin-2022-2026/chroma/*.png`
- Create privately: `/private/tmp/wardrobe-import-benjamin-2022-2026/items/*.png`
- Update privately: `/private/tmp/wardrobe-import-benjamin-2022-2026/manifest.json`
- Create privately: `/private/tmp/wardrobe-import-benjamin-2022-2026/qa/crops-*.jpg`
- Create privately: `/private/tmp/wardrobe-import-benjamin-2022-2026/qa/items-*.png`

**Interfaces:**
- Consumes: `generate` records, source JPEGs, source references, and the built-in Imagegen tool.
- Produces: one source-faithful transparent PNG per passing garment and an updated manifest with `accepted` or `hold` status.

- [ ] **Step 1: Read the required image-generation instructions**

Read completely:

```text
/Users/benjaminapt/.codex/skills/.system/imagegen/SKILL.md
/Users/benjaminapt/Documents/Wardrobe/.agents/skills/import-clothes/SKILL.md
```

Expected: generation uses Imagegen, not a Python image-generation substitute.

- [ ] **Step 2: Prepare focused references**

For each `generate` item, crop the strongest source view with approximately 12% padding. Add at most one complementary crop only when it provides defining construction unavailable in the first. Preserve enough context to distinguish the target from underlayers.

Expected: each slug has one primary crop and zero or one complementary crop.

- [ ] **Step 3: Inspect labeled crop contact sheets**

Create sheets of at most 12 crops using the same `420×420` labeled-cell format as Task 3. Inspect every crop before generation.

Expected: every crop clearly identifies its target garment and no crop is mislabeled.

- [ ] **Step 4: Generate cutouts in disjoint batches**

For each slug, pass the primary crop and only a genuinely complementary second crop to Imagegen. Request the complete empty garment centered with generous padding, no shadow, and no body, wearer, mannequin, hanger, prop, other layer, or scene.

Use `#00ff00` by default, `#ff00ff` for green garments unless magenta is prominent, or another maximally distant saturated RGB key when needed. Explicitly list uncertain details that must be omitted.

Expected: `/chroma/SLUG.png` exists for each processed item and is compared against its sources before cleanup.

- [ ] **Step 5: Remove each chroma background**

Run for every generated slug:

```bash
python3 /Users/benjaminapt/.codex/skills/.system/imagegen/scripts/remove_chroma_key.py \
  --input /private/tmp/wardrobe-import-benjamin-2022-2026/chroma/SLUG.png \
  --out /private/tmp/wardrobe-import-benjamin-2022-2026/items/SLUG.png \
  --auto-key border \
  --soft-matte \
  --transparent-threshold 12 \
  --opaque-threshold 220 \
  --despill \
  --force
```

Here `SLUG` is the exact manifest slug currently being processed.

Expected: the output is an RGBA PNG with transparent corners and visible garment pixels.

- [ ] **Step 6: Run deterministic PNG validation**

Run:

```bash
node --input-type=module -e '
import { readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
const directory = "/private/tmp/wardrobe-import-benjamin-2022-2026/items";
const files = (await readdir(directory)).filter(name => name.endsWith(".png")).sort();
if (!files.length) throw new Error("No item PNGs");
for (const name of files) {
  const image = sharp(path.join(directory, name));
  const metadata = await image.metadata();
  const stats = await image.stats();
  const alpha = stats.channels[3];
  if (metadata.format !== "png" || !metadata.hasAlpha || !alpha || alpha.min !== 0 || alpha.max === 0) {
    throw new Error(`Invalid transparent PNG: ${name}`);
  }
}
console.log(JSON.stringify({ validated: files.length }));
'
```

Expected: one JSON summary whose validated count equals the number of item PNGs.

- [ ] **Step 7: Perform visual cutout QA**

Create checkerboard contact sheets of at most 12 items. Compare each output with its source crops for category, proportions, color, material, construction, pattern, and marks. Reject body parts, underlayers, props, shadows, clipped extremities, and chroma halos.

Expected: critical or major failures are regenerated; unrecoverable items change to `hold`.

- [ ] **Step 8: Mark only passing cutouts accepted**

Change each passing manifest record to `status: "accepted"`. Leave failed records as `hold` with a concise reason in `unknowns`.

Expected: every accepted record has exactly one valid PNG in `items/`.

---

### Task 5: Generate and Verify Modeled Editorial Previews

**Files:**
- Consume privately: `data/model-reference.png`
- Consume privately: `/private/tmp/wardrobe-import-benjamin-2022-2026/items/*.png`
- Create privately: `/private/tmp/wardrobe-import-benjamin-2022-2026/modeled/*.png`
- Update privately: `/private/tmp/wardrobe-import-benjamin-2022-2026/manifest.json`

**Interfaces:**
- Consumes: the approved identity reference and accepted garment cutouts.
- Produces: optional horizontal 3:2 modeled PNGs that preserve identity and garment fidelity.

- [ ] **Step 1: Verify the identity reference is local and ignored**

Run:

```bash
test -f data/model-reference.png
git check-ignore -q data/model-reference.png
```

Expected: both commands exit `0`.

- [ ] **Step 2: Generate one modeled preview per accepted garment**

Use Imagegen with `data/model-reference.png` first and the exact garment PNG second. Use the modeled-image brief in `.agents/skills/import-clothes/SKILL.md`. Save a horizontal 3:2 PNG to:

```text
/private/tmp/wardrobe-import-benjamin-2022-2026/modeled/SLUG.png
```

Expected: each modeled image keeps Benjamín recognizable and displays the complete featured garment.

- [ ] **Step 3: Compare every preview against both references**

Reject identity drift, garment redesign, hidden details, fake text or logos, anatomy failures, extra people, and incorrect framing.

Expected: critical or major failures are regenerated. If the garment cutout passes but a trustworthy modeled result cannot be produced, set `modeledFile` to `null` and retain the accepted cutout.

- [ ] **Step 4: Validate modeled files**

Run:

```bash
node --input-type=module -e '
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
const root = "/private/tmp/wardrobe-import-benjamin-2022-2026";
const manifest = JSON.parse(await readFile(path.join(root, "manifest.json"), "utf8"));
const files = manifest.items.filter(item => item.status === "accepted" && item.modeledFile).map(item => item.modeledFile);
for (const name of files) {
  const metadata = await sharp(path.join(root, "modeled", name)).metadata();
  if (metadata.format !== "png" || !metadata.width || !metadata.height) throw new Error(`Invalid modeled PNG: ${name}`);
}
console.log(JSON.stringify({ validated: files.length }));
'
```

Expected: every modeled filename in the manifest resolves to one valid PNG in `modeled/`.

---

### Task 6: Dry-run, Import, and Verify Wardrobe

**Files:**
- Consume privately: `/private/tmp/wardrobe-import-benjamin-2022-2026/manifest.json`
- Consume privately: `/private/tmp/wardrobe-import-benjamin-2022-2026/items/*.png`
- Consume privately: `/private/tmp/wardrobe-import-benjamin-2022-2026/modeled/*.png`
- Create privately: `data/library.json`
- Create privately: `data/imported/*.png`

**Interfaces:**
- Consumes: accepted and QA-passing assets.
- Produces: an atomically updated local database and a visually verified Wardrobe gallery.

- [ ] **Step 1: Confirm the final accepted set**

Run:

```bash
node --input-type=module -e '
import { readFileSync } from "node:fs";
const file = "/private/tmp/wardrobe-import-benjamin-2022-2026/manifest.json";
const items = JSON.parse(readFileSync(file, "utf8")).items.filter(x => x.status === "accepted");
console.log(JSON.stringify(items.map(({slug,name,part,modeledFile}) => ({slug,name,part,modeledFile})), null, 2));
if (!items.length) throw new Error("No accepted items");
'
```

Expected: a nonempty final list matching the completed QA.

- [ ] **Step 2: Run the deterministic importer in dry-run mode**

Run:

```bash
node .agents/skills/import-clothes/scripts/import-to-wardrobe.mjs \
  --items /private/tmp/wardrobe-import-benjamin-2022-2026/items \
  --modeled /private/tmp/wardrobe-import-benjamin-2022-2026/modeled \
  --manifest /private/tmp/wardrobe-import-benjamin-2022-2026/manifest.json \
  --dry-run
```

Expected: JSON with `"dryRun": true`, the accepted import count, and no validation error.

- [ ] **Step 3: Run the real import**

Run:

```bash
node .agents/skills/import-clothes/scripts/import-to-wardrobe.mjs \
  --items /private/tmp/wardrobe-import-benjamin-2022-2026/items \
  --modeled /private/tmp/wardrobe-import-benjamin-2022-2026/modeled \
  --manifest /private/tmp/wardrobe-import-benjamin-2022-2026/manifest.json
```

Expected: JSON with `"dryRun": false`; `data/library.json` and imported assets exist.

- [ ] **Step 4: Run the production build after import**

Run:

```bash
npm run check
```

Expected: exit `0`.

- [ ] **Step 5: Start the local gallery**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Expected: Vite reports a local URL, normally `http://127.0.0.1:5173`.

- [ ] **Step 6: Verify the gallery in a browser**

Open the local URL and inspect every imported card. Verify image loading, names, categories, colors, modeled previews, expected count, and absence of obvious duplicates.

Expected: one gallery record per accepted physical garment and no broken asset URLs.

- [ ] **Step 7: Verify private assets remain untracked**

Run:

```bash
git status --short
git ls-files data
find data -type f -print
```

Expected: `git ls-files data` prints nothing; personal files may appear only in the ignored-data listing.

---

### Task 7: Record the Result and Publish Code-only History

**Files:**
- Create: `CLAUDE.md`
- Verify: `.gitignore`
- Verify: all tracked files

**Interfaces:**
- Consumes: the final import counts, held-item reasons, gallery verification, and Git status.
- Produces: a concise project record and a pushed code-only commit history.

- [ ] **Step 1: Write the project record**

Create `CLAUDE.md` containing:

- what was completed;
- the accepted and held item counts;
- the absolute local database path;
- the fact that personal assets are ignored and local;
- any remaining gaps;
- the next recommended step.

Do not include photo filenames, locations, faces, or other private media metadata.

- [ ] **Step 2: Run the final privacy scan**

Run:

```bash
git status --short
git diff --check
git ls-files | rg -i '\.(jpe?g|png|webp|heic|heif|tiff?|bmp|avif|mov|mp4|m4v)$' || true
git ls-files data
```

Expected: no tracked personal media and no tracked `data/` files.

- [ ] **Step 3: Commit the code-only operational record**

Run:

```bash
git add CLAUDE.md
git commit -m "docs: record personal wardrobe import"
```

Expected: the commit contains only `CLAUDE.md`.

- [ ] **Step 4: Create or reuse Benjamín's GitHub fork**

Keep `tandpfun/wardrobe` as `upstream`, create or reuse `benjaminapt/wardrobe` as `origin`, and do not include any ignored data files.

Expected:

```text
upstream -> https://github.com/tandpfun/wardrobe.git
origin   -> benjaminapt/wardrobe
```

- [ ] **Step 5: Push the code-only history**

Run:

```bash
git push -u origin main
```

Expected: the design, plan, and operational record are present on `benjaminapt/wardrobe`; personal photos and generated wardrobe assets are absent.

- [ ] **Step 6: Deliver the result**

Report:

- imported garment count;
- held and rejected counts with concise reasons;
- absolute path to `data/library.json`;
- local gallery verification result;
- Git commit and push result.

Display up to 12 final cutouts in chat. Keep the temporary workspace until Benjamín confirms the delivery is satisfactory.
