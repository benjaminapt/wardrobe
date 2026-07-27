# Personal Wardrobe Import Design

Date: 2026-07-27

## Summary

Build Benjamín's personal Wardrobe gallery from photos in the macOS Photos library. Use photos associated with the person named `Benjamín` from 2022 through 2026, select a manageable set of useful source images, identify and deduplicate garments, generate source-faithful garment cutouts and modeled previews, and import only approved items into Wardrobe.

The first version is personal and local. Commercialization, customer accounts, payments, hosted storage, and a self-service Photos integration are explicitly out of scope.

## Goals

- Produce a useful gallery of garments Benjamín currently owns.
- Discover garments from photos where Benjamín is wearing them.
- Preserve source-supported colors, materials, patterns, construction, and visible marks.
- Avoid duplicate records when the same physical garment appears in several photos.
- Keep the Photos library unchanged.
- Keep personal photos, the identity reference, and intermediate files local and out of Git.
- Use Benjamín's current Codex OAuth session instead of an OpenAI API key.

## Non-goals

- Exhaustively reconstruct every garment ever worn between 2022 and 2026.
- Process videos in the first pass.
- Enable Wardrobe's in-app API-backed importer.
- Build a commercial SaaS, native Photos app, payment flow, or subscription system.
- Modify or organize the source Photos library.
- Invent garment details that are not supported by the source photos.

## Source Scope

- Photos person: `Benjamín`.
- Date range: 2022-01-01 through 2026-07-27.
- Target shortlist: approximately 40 to 80 photos.
- Prefer clear full-body or half-body views, complementary angles, good lighting, and unobstructed garments.
- Exclude screenshots, documents, irrelevant images, low-quality frames, and group photos where Benjamín or the garment cannot be identified confidently.
- Use group photos only when they provide a uniquely useful garment view.
- Leave videos out of the first pass.

The target count is a selection guide, not a quota. Selection stops when additional photos no longer reveal new garments or useful construction details.

## Workflow

### 1. Select source photos

Review Photos in read-only mode and shortlist useful images from the approved person and date range. Export copies at the best available quality to a temporary workspace outside the repository.

### 2. Build an inventory

Create contact sheets and inspect every shortlisted photo. Record each deliberately worn garment, accessory, and pair of shoes. Link all useful source views to the same physical item and deduplicate repeated appearances.

Each inventory record contains:

- a stable slug and human-readable name;
- Wardrobe category;
- primary and optional secondary color;
- concise tags;
- source image references;
- known visual details;
- uncertainties;
- status: `candidate`, `hold`, `approved`, or `rejected`.

### 3. Confirm current ownership

Present the deduplicated candidate list to Benjamín before generation. Benjamín removes garments he no longer owns and resolves any uncertain duplicates. Only approved current garments advance.

### 4. Generate garment cutouts

Follow the repository's bundled `import-clothes` skill and the built-in Imagegen workflow. For each approved garment:

- choose the strongest source view and at most one complementary view;
- reconstruct exactly one complete item on a removable chroma background;
- remove the wearer, body parts, underlayers, hangers, props, and scene;
- remove the chroma background locally;
- verify transparency, padding, construction, color, pattern, and source fidelity.

If a defining detail cannot be recovered without substantial invention, mark the item `hold` instead of generating a misleading result.

### 5. Generate modeled previews

Choose a clear, recent PNG photo of Benjamín as the local identity reference. Benjamín approves the reference before it is used. For each accepted cutout, generate a modeled editorial preview that preserves both Benjamín's identity and the garment's visible details.

Modeled generation is optional for an item when the garment cutout passes but the available evidence is insufficient for a trustworthy modeled result.

### 6. Import into Wardrobe

Use the repository's deterministic importer to:

- validate accepted PNGs;
- copy garment and modeled assets into the ignored local data directory;
- atomically update `data/library.json`;
- avoid duplicate records when an identical cutout is re-imported.

### 7. Verify the gallery

Install dependencies and run the local Wardrobe gallery. Verify the item count, image loading, categories, metadata, and absence of obvious duplicates. Inspect the complete gallery visually and correct critical failures before completion.

## Data Flow

```text
macOS Photos
  -> temporary exported copies
  -> shortlisted source contact sheets
  -> deduplicated candidate inventory
  -> Benjamín ownership review
  -> generated chroma garment images
  -> local transparent garment PNGs
  -> modeled previews
  -> deterministic Wardrobe import
  -> local gallery verification
```

The source Photos library is never written to. Temporary exports and generation intermediates remain outside the repository. Only code and documentation are tracked in Git; Wardrobe's ignored local data directory contains the finished personal library.

## Quality Gates

Every accepted garment must satisfy all applicable checks:

- exactly one garment, established matching pair, or accessory;
- source-faithful type, silhouette, color, material, pattern, construction, and visible marks;
- no invented logo, text, pocket, seam, closure, hardware, or trim;
- no wearer, skin, hair, underlayer, adjacent garment, prop, shadow, or chroma halo;
- valid PNG with an alpha channel, transparent border, visible content, and adequate padding;
- correct category, colors, name, and tags;
- no duplicate physical item already accepted.

Every modeled preview must satisfy:

- recognizable identity consistent with the approved Benjamín reference;
- exact featured garment preserved;
- garment fully visible and not covered by pose or accessories;
- plausible anatomy, lighting, and framing;
- no invented text, logos, closures, or statement pieces.

Critical or major failures are regenerated. Unrecoverable items are held and reported rather than silently accepted.

## Error Handling

- An unavailable iCloud original is skipped until Photos finishes downloading it.
- A low-confidence person or garment match is excluded from the shortlist.
- A questionable duplicate remains unresolved until Benjamín reviews it.
- A garment with insufficient evidence is held.
- A failed chroma removal is regenerated with a better key color rather than forced through.
- An invalid import aborts before `data/library.json` is replaced.
- Partial generation batches retain their manifest so missing items can resume without repeating successful work.

## Privacy and Repository Hygiene

- Do not delete, edit, favorite, tag, or reorganize source photos.
- Do not add source photos, identity references, temporary crops, prompts, manifests, QA sheets, or generated personal assets to Git.
- Keep `data/model-reference.png`, `data/library.json`, and `data/imported/` ignored.
- Before any push, inspect tracked files and staged changes for personal media.
- The personal workflow uses the authenticated Codex session. The standalone web importer remains disabled without `OPENAI_API_KEY`.

## Verification

Implementation verification includes:

- `npm install`;
- `npm run check`;
- deterministic importer validation before the real import;
- individual and contact-sheet visual inspection of every accepted cutout;
- individual comparison of every modeled preview against both references;
- local gallery launch and visual inspection;
- confirmation that the gallery contains one record per accepted physical garment;
- confirmation that Git tracks no personal photos or generated wardrobe assets.

## Success Criteria

The first pass is complete when:

- the approved 2022–2026 shortlist has been reviewed;
- all discoverable garments have been inventoried and deduplicated;
- Benjamín has removed items he no longer owns;
- every imported item passes the cutout quality gates;
- modeled previews are present where evidence supports them;
- Wardrobe loads locally with the expected accepted-item count;
- no personal source or generated media is tracked by Git;
- held or rejected items are reported with concise reasons.

