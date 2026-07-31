# Outfits Section and Theme Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Show the generated outfit lookbook in local and static Wardrobe builds, and give the user a persistent day/night control.

**Architecture:** A small theme utility owns resolution and persistence while App applies the resolved value to the shell. A parallel outfit source follows the wardrobe-source pattern. The Vite plugin exposes ignored local outfit data only in development; the static exporter copies validated active outfit images into the protected snapshot during its existing atomic export.

**Tech Stack:** React 19, Vite 6 plugins, Node 22+ built-in test runner, CSS custom properties, Vercel prebuilt deployment.

## Global Constraints

- Keep data, public/wardrobe, and .vercel ignored; never commit original or generated private images.
- Publish the protected preview only with Vercel build followed by a prebuilt preview deployment.
- Use open-wardrobe-theme-v1; the OS preference is used only when no valid manual choice exists.
- Export only active outfits and reject image paths outside data/outfit-images.
- Preserve garment import, editing, and static-library behavior.

---

### Task 1: Theme state utility

**Files:**
- Create: src/theme.js
- Create: src/theme.test.js

**Interfaces:**
- Produces: THEME_STORAGE_KEY, resolveTheme({ storage, prefersDark }), toggleTheme(theme), and persistTheme({ storage, theme }).

- [ ] **Step 1: Write the failing test**

~~~js
import assert from "node:assert/strict";
import test from "node:test";
import { THEME_STORAGE_KEY, persistTheme, resolveTheme, toggleTheme } from "./theme.js";

function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
}

test("uses the stored manual theme before the operating-system preference", () => {
  assert.equal(resolveTheme({ storage: storage({ [THEME_STORAGE_KEY]: "light" }), prefersDark: true }), "light");
});

test("uses the operating-system preference when no valid manual theme exists", () => {
  assert.equal(resolveTheme({ storage: storage({ [THEME_STORAGE_KEY]: "sepia" }), prefersDark: false }), "light");
});

test("toggles and persists explicit themes", () => {
  const target = storage();
  assert.equal(toggleTheme("dark"), "light");
  persistTheme({ storage: target, theme: "light" });
  assert.equal(resolveTheme({ storage: target, prefersDark: true }), "light");
});
~~~

- [ ] **Step 2: Verify the test fails**

Run: node --test src/theme.test.js

Expected: FAIL because src/theme.js does not exist.

- [ ] **Step 3: Implement the minimal utility**

~~~js
export const THEME_STORAGE_KEY = "open-wardrobe-theme-v1";

export function resolveTheme({ storage, prefersDark }) {
  const saved = storage?.getItem(THEME_STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return prefersDark ? "dark" : "light";
}

export function toggleTheme(theme) {
  return theme === "dark" ? "light" : "dark";
}

export function persistTheme({ storage, theme }) {
  storage?.setItem(THEME_STORAGE_KEY, theme);
}
~~~

- [ ] **Step 4: Verify the test passes**

Run: node --test src/theme.test.js

Expected: 3 passing tests.

- [ ] **Step 5: Commit**

~~~bash
git add src/theme.js src/theme.test.js
git commit -m "feat: persist wardrobe theme choice"
~~~

### Task 2: Outfit source and local API

**Files:**
- Create: src/outfit-source.js
- Create: src/outfit-source.test.js
- Create: scripts/outfit-api.mjs
- Modify: vite.config.mjs:1-20

**Interfaces:**
- Produces: loadOutfits({ fetchImpl = fetch, staticMode = false }), returning an array of active outfits.
- Adds local routes GET /api/import/outfits and GET /api/import/outfits/:filename.

- [ ] **Step 1: Write the failing source tests**

~~~js
import assert from "node:assert/strict";
import test from "node:test";
import { loadOutfits } from "./outfit-source.js";

function response({ ok = true, payload = [] } = {}) { return { ok, json: async () => payload }; }

test("static mode loads the exported outfit snapshot", async () => {
  const requested = [];
  const outfits = await loadOutfits({ staticMode: true, fetchImpl: async (url) => {
    requested.push(url);
    return response({ payload: [{ id: "look", image: null }] });
  } });
  assert.deepEqual(outfits, [{ id: "look", image: null }]);
  assert.deepEqual(requested, ["/wardrobe/outfits.json"]);
});

test("local mode loads outfits from the local API", async () => {
  const requested = [];
  await loadOutfits({ fetchImpl: async (url) => { requested.push(url); return response({ payload: [{ id: "look" }] }); } });
  assert.deepEqual(requested, ["/api/import/outfits"]);
});

test("rejects unavailable and malformed outfit payloads", async () => {
  await assert.rejects(() => loadOutfits({ fetchImpl: async () => response({ ok: false }) }), /Could not load outfits/);
  await assert.rejects(() => loadOutfits({ fetchImpl: async () => response({ payload: { outfits: [] } }) }), /Outfits response must be an array/);
});
~~~

- [ ] **Step 2: Verify the source tests fail**

Run: node --test src/outfit-source.test.js

Expected: FAIL because src/outfit-source.js does not exist.

- [ ] **Step 3: Implement source and API**

~~~js
export async function loadOutfits({ fetchImpl = fetch, staticMode = false } = {}) {
  const response = await fetchImpl(staticMode ? "/wardrobe/outfits.json" : "/api/import/outfits", { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load outfits.");
  const outfits = await response.json();
  if (!Array.isArray(outfits)) throw new Error("Outfits response must be an array.");
  return outfits;
}
~~~

scripts/outfit-api.mjs parses data/outfits.json, responds with only records whose status is active, and serves image files only when path.basename(filename) equals filename. It returns 400 for escaped names and 404 for absent files. Register outfitApi() in vite.config.mjs.

- [ ] **Step 4: Verify the source tests pass**

Run: node --test src/outfit-source.test.js

Expected: 3 passing tests.

- [ ] **Step 5: Commit**

~~~bash
git add src/outfit-source.js src/outfit-source.test.js scripts/outfit-api.mjs vite.config.mjs
git commit -m "feat: load local outfit lookbook"
~~~

### Task 3: Atomic static outfit export

**Files:**
- Modify: scripts/static-wardrobe-export.mjs:1-88
- Modify: scripts/static-wardrobe-export.test.mjs:1-82

**Interfaces:**
- Extends: exportStaticWardrobe({ libraryPath, assetRoot, outputDir, outfitsPath, outfitImageRoot }).
- Produces: existing library.json and assets plus outfits.json and outfits/basename in one temporary-directory rename.

- [ ] **Step 1: Write failing exporter tests**

~~~js
test("exports active outfits and rewrites their modeled image URLs", async () => {
  const paths = await fixture([{ id: "item", image: "/api/import/library/item.png", thumbnail: "/api/import/library/item.png" }]);
  const outfitsPath = path.join(paths.root, "outfits.json");
  const outfitImageRoot = path.join(paths.root, "outfits");
  await writeFile(path.join(paths.assetRoot, "item.png"), "item");
  await mkdir(outfitImageRoot);
  await writeFile(outfitsPath, JSON.stringify({ outfits: [
    { id: "look", status: "active", image: "/api/import/outfits/look.png" },
    { id: "draft", status: "planned", image: "/api/import/outfits/draft.png" },
  ] }));
  await writeFile(path.join(outfitImageRoot, "look.png"), "look");

  await exportStaticWardrobe({ ...paths, outfitsPath, outfitImageRoot });
  assert.deepEqual(JSON.parse(await readFile(path.join(paths.outputDir, "outfits.json"), "utf8")), [
    { id: "look", status: "active", image: "/wardrobe/outfits/look.png" },
  ]);
  assert.equal(await readFile(path.join(paths.outputDir, "outfits", "look.png"), "utf8"), "look");
});

test("preserves an active outfit with a missing image and rejects escaped outfit paths", async () => {
  const paths = await fixture([{ id: "item", image: "/api/import/library/item.png", thumbnail: "/api/import/library/item.png" }]);
  const outfitsPath = path.join(paths.root, "outfits.json");
  const outfitImageRoot = path.join(paths.root, "outfits");
  await writeFile(path.join(paths.assetRoot, "item.png"), "item");
  await mkdir(outfitImageRoot);
  await writeFile(outfitsPath, JSON.stringify({ outfits: [{ id: "missing", status: "active", image: "/api/import/outfits/missing.png" }] }));
  await exportStaticWardrobe({ ...paths, outfitsPath, outfitImageRoot });
  assert.equal(JSON.parse(await readFile(path.join(paths.outputDir, "outfits.json"), "utf8"))[0].image, null);

  await writeFile(outfitsPath, JSON.stringify({ outfits: [{ id: "unsafe", status: "active", image: "/api/import/outfits/../private.png" }] }));
  await assert.rejects(
    () => exportStaticWardrobe({ ...paths, outfitsPath, outfitImageRoot }),
    /Invalid outfit image URL/,
  );
});
~~~

- [ ] **Step 2: Verify the exporter test fails**

Run: node --test scripts/static-wardrobe-export.test.mjs

Expected: FAIL because the exporter neither accepts outfit paths nor creates outfit files.

- [ ] **Step 3: Extend the exporter**

Retain the existing temporary-directory and final rename. When optional outfit paths are present, parse the manifest, filter active records, validate /api/import/outfits URLs using a basename-only helper, copy present images into temporaryDir/outfits, change absent images to null, and write the active array to temporaryDir/outfits.json. The script entry point passes data/outfits.json and data/outfit-images.

- [ ] **Step 4: Verify the exporter test passes**

Run: node --test scripts/static-wardrobe-export.test.mjs

Expected: all existing garment tests and both new outfit cases pass.

- [ ] **Step 5: Commit**

~~~bash
git add scripts/static-wardrobe-export.mjs scripts/static-wardrobe-export.test.mjs
git commit -m "feat: export private outfit snapshots"
~~~

### Task 4: App integration and adaptive styling

**Files:**
- Modify: src/App.jsx:1-648
- Modify: src/styles.css:1-950
- Modify: src/import-flow.css:1-330
- Modify: index.html:3-20

**Interfaces:**
- Consumes: theme utility, loadOutfits, and active records { id, name, occasion, garmentIds, image }.
- Produces: an Outfits header mode, a read-only OutfitCard, and a labelled day/night button.

- [ ] **Step 1: Add focused failing assertions**

Add the persistence assertion from Task 1 and the null-image outfit record from Task 2. Both demonstrate the required view inputs before changing React.

- [ ] **Step 2: Verify the focused tests fail**

Run: node --test src/theme.test.js src/outfit-source.test.js

Expected: FAIL until the storage and null-image contracts are satisfied.

- [ ] **Step 3: Integrate React and CSS**

In App, initialise theme with resolveTheme using localStorage and window.matchMedia("(prefers-color-scheme: dark)").matches. On toggle, persist the next value, set document.documentElement.style.colorScheme, and update the meta[name="theme-color"] value to #0a0a0c or #f4f0e8. Apply data-theme={theme} to app-shell.

Add view state (wardrobe or outfits), outfit loading/error state, an Outfits button next to category filters, and an OutfitCard grid. Garment filters select wardrobe view. Each outfit card uses OptimizedImage when image exists; otherwise it renders a labelled empty tile. Render name, occasion tags, and garmentIds.length; do not add editing or generation actions.

Move fixed dark surfaces used by gallery, overlay, panel, form, and import flow into inherited variables. Add [data-theme="light"] values for warm paper surfaces, dark ink, borders, overlays, import cards, and status states. Keep the purple accent and retain all responsive breakpoints.

- [ ] **Step 4: Verify focused tests and builds pass**

Run: node --test src/theme.test.js src/outfit-source.test.js && npm run build && npm run build:static

Expected: all tests pass and both Vite builds exit 0.

- [ ] **Step 5: Commit**

~~~bash
git add src/App.jsx src/styles.css src/import-flow.css index.html src/theme.test.js src/outfit-source.test.js
git commit -m "feat: add outfits and manual theme toggle"
~~~

### Task 5: Record, merge, and deploy

**Files:**
- Modify: CLAUDE.md

**Interfaces:**
- Consumes: full test/build output and merged main.
- Produces: handoff record and a fresh protected Vercel preview.

- [ ] **Step 1: Record the release**

Add the active outfit count, explicit theme behavior, tests, preview URL, and privacy boundary to CLAUDE.md.

- [ ] **Step 2: Run full verification**

Run: npm run test:static-export && node --test src/wardrobe-source.test.js src/outfit-source.test.js src/theme.test.js && npm run build && npm run build:static && git diff --check

Expected: all Node tests pass, both builds exit 0, and no whitespace errors.

- [ ] **Step 3: Commit, merge, and deploy**

~~~bash
git add CLAUDE.md
git commit -m "docs: record outfits and theme release"
git push -u origin codex/outfits-and-theme
gh api --method POST repos/benjaminapt/wardrobe/pulls -f title='feat: add outfits and manual theme toggle' -f head='codex/outfits-and-theme' -f base='main' -F draft=false
gh pr merge codex/outfits-and-theme --repo benjaminapt/wardrobe --merge
git switch main && git pull --ff-only origin main
npx --yes vercel@58.4.4 build --yes
npx --yes vercel@58.4.4 deploy --prebuilt --target preview --yes
~~~

- [ ] **Step 4: Verify the merged preview**

Run: npx --yes vercel@58.4.4 curl / --deployment wardrobe-private-benjaminaptc-4943-benjaminaptc-4943s-projects.vercel.app && curl -sS -I https://wardrobe-private-benjaminaptc-4943-benjaminaptc-4943s-projects.vercel.app

Expected: authenticated Vercel curl returns the new app HTML, and anonymous curl returns 302 to vercel.com/sso-api.
