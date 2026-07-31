# Private Vercel Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish Benjamín's current Wardrobe catalog at a persistent Vercel preview URL restricted to his Vercel account.

**Architecture:** Keep `data/library.json` and all personal assets local and ignored by Git. A tested exporter builds an ignored static snapshot containing only accepted metadata and referenced derived images; a static build uses that snapshot and disables mutating import controls. Vercel receives only the prebuilt artifact, and Vercel Authentication protects the preview.

**Tech Stack:** Node.js 22+, Node test runner, React 19, Vite 6, Vercel CLI 56.

## Global Constraints

- Do not upload original gallery photos.
- Do not commit private wardrobe data, generated snapshot files, or garment images to Git.
- Include the current working-tree visual changes from Antigravity without reviewing or rewriting them.
- Keep local `/api/import/*` behavior and the local import interface unchanged.
- Deploy a preview, not a public production domain.
- Do not hand off a URL unless signed-out access is challenged by Vercel Authentication.

---

### Task 1: Static Snapshot Exporter

**Files:**
- Create: `scripts/static-wardrobe-export.mjs`
- Create: `scripts/static-wardrobe-export.test.mjs`
- Modify: `package.json`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `exportStaticWardrobe({ libraryPath, assetRoot, outputDir })` paths.
- Produces: `{ itemCount, assetCount, outputDir }` and an exported `library.json` whose asset URLs start with `/wardrobe/assets/`.

- [ ] **Step 1: Write failing exporter tests**

Use `node:test` temporary directories to cover URL rewriting, deduplicated asset copying, omission of a missing optional `modeledImage`, and rejection of a missing required garment image.

```js
const result = await exportStaticWardrobe({ libraryPath, assetRoot, outputDir });
assert.deepEqual(result, { itemCount: 1, assetCount: 1, outputDir });
assert.equal(exported[0].image, "/wardrobe/assets/item-garment.png");
await assert.rejects(() => exportStaticWardrobe(invalid), /Missing required wardrobe asset/);
```

- [ ] **Step 2: Verify the tests fail before implementation**

Run: `node --test scripts/static-wardrobe-export.test.mjs`  
Expected: FAIL because `static-wardrobe-export.mjs` does not exist.

- [ ] **Step 3: Implement the exporter**

Validate that the library is an array, resolve only filenames under `/api/import/library/`, reject path traversal, require `image` and `thumbnail` assets, omit a missing optional `modeledImage`, copy each referenced asset once, rewrite URLs, write formatted JSON, and atomically replace the ignored output directory.

```js
export async function exportStaticWardrobe({ libraryPath, assetRoot, outputDir }) {
  // returns { itemCount, assetCount, outputDir }
}
```

- [ ] **Step 4: Add scripts and privacy ignore**

Add these package scripts:

```json
"test:static-export": "node --test scripts/static-wardrobe-export.test.mjs",
"export:static": "node scripts/static-wardrobe-export.mjs",
"build:static": "npm run export:static && VITE_STATIC_WARDROBE=1 vite build"
```

Add `public/wardrobe/` to `.gitignore`.

- [ ] **Step 5: Run exporter tests**

Run: `npm run test:static-export`  
Expected: all tests PASS.

- [ ] **Step 6: Commit the exporter**

```bash
git add .gitignore package.json scripts/static-wardrobe-export.mjs scripts/static-wardrobe-export.test.mjs
git commit -m "feat: export private static wardrobe snapshot"
```

### Task 2: Hosted Read-Only Data Source

**Files:**
- Create: `src/wardrobe-source.js`
- Create: `src/wardrobe-source.test.js`
- Modify: `src/App.jsx`
- Modify: `src/OptimizedImage.jsx`

**Interfaces:**
- Consumes: `loadWardrobe({ fetchImpl, staticMode })`.
- Produces: a wardrobe array loaded directly from `/wardrobe/library.json` in static mode or from `/api/import/wardrobe` in local mode.

- [ ] **Step 1: Write failing source-selection tests**

```js
const items = await loadWardrobe({ fetchImpl, staticMode: true });
assert.equal(fetchImpl.mock.calls[0][0], "/wardrobe/library.json");
await assert.rejects(() => loadWardrobe({ fetchImpl: failing, staticMode: false }), /Could not load/);
```

Cover static selection, local API selection, non-OK responses, and non-array payloads.

- [ ] **Step 2: Verify the tests fail before implementation**

Run: `node --test src/wardrobe-source.test.js`  
Expected: FAIL because `wardrobe-source.js` does not exist.

- [ ] **Step 3: Implement and integrate static mode**

Use `const STATIC_MODE = import.meta.env.VITE_STATIC_WARDROBE === "1"`. Replace the inline fetch in `App.jsx` with `loadWardrobe`, skip the delete API request in static mode, and omit `WardrobeImportFlow` in static mode. Treat `/wardrobe/` images as direct `<img>` sources in `OptimizedImage.jsx` so the hosted build does not depend on the development-only IPX endpoint.

- [ ] **Step 4: Run unit and production builds**

Run:

```bash
node --test src/wardrobe-source.test.js
npm run check
npm run build:static
```

Expected: tests PASS, both builds exit `0`, and `dist/wardrobe/library.json` exists.

- [ ] **Step 5: Verify snapshot privacy and completeness**

Run a Node assertion that the source library count equals the exported count, every exported asset exists in `dist/wardrobe/assets`, and no exported filename matches source-photo formats outside the referenced accepted assets.

- [ ] **Step 6: Commit hosted read-only support**

```bash
git add src/App.jsx src/OptimizedImage.jsx src/wardrobe-source.js src/wardrobe-source.test.js
git commit -m "feat: support private hosted wardrobe snapshot"
```

### Task 3: Vercel Prebuilt Preview

**Files:**
- Create: `vercel.json`
- Create locally: `.vercel/project.json`
- Update: `CLAUDE.md`

**Interfaces:**
- Consumes: ignored `public/wardrobe/`, Vite static build, authenticated Vercel CLI.
- Produces: a protected Vercel preview URL and a repeatable refresh command sequence.

- [ ] **Step 1: Add deterministic Vercel build configuration**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build:static",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

- [ ] **Step 2: Link the project**

Run `vercel link --yes --project wardrobe-private` from the repository root and verify `.vercel/project.json` points to Benjamín's Vercel scope.

- [ ] **Step 3: Build the Vercel artifact locally**

Run: `vercel build`  
Expected: `.vercel/output/static/wardrobe/library.json` and all referenced assets exist.

- [ ] **Step 4: Deploy the prebuilt preview**

Run: `vercel deploy --prebuilt`  
Expected: CLI returns a persistent HTTPS preview URL; do not pass `--prod` or `--public`.

- [ ] **Step 5: Enforce and verify Vercel Authentication**

Enable Standard Protection for preview deployments in the project settings. Verify a signed-out `curl -I` receives a redirect or challenge rather than `200`, then use authenticated `vercel curl` to verify the page, catalog JSON, and a sample garment asset return `200`.

- [ ] **Step 6: Validate the authenticated UI**

Open the protected preview while authenticated. Confirm the 64-piece catalog loads, representative garment images render, import controls are absent, and browser errors do not show missing assets.

- [ ] **Step 7: Record operations and commit**

Add the protected preview URL, refresh commands, privacy boundary, and current item/modeled-image counts to `CLAUDE.md`, then run:

```bash
git add vercel.json CLAUDE.md docs/superpowers/plans/2026-07-31-private-vercel-preview.md
git commit -m "chore: configure private Vercel preview"
git push origin main
```

- [ ] **Step 8: Final verification**

Run `git status --short --branch`, `vercel inspect <preview-url>`, signed-out protection check, authenticated catalog check, and `npm run check`. Expected: tracked deployment work committed and pushed; only pre-existing Antigravity or local utility files remain uncommitted.

