# Outfits section and manual theme control

## Goal

Make the ten locally generated outfits visible in both the local app and the protected static preview. Let the user explicitly choose day or night mode, independently of the operating-system setting.

## Scope

### Theme

- The app resolves a theme from `localStorage` key `open-wardrobe-theme-v1`.
- If no choice has been stored, it uses `prefers-color-scheme` to choose the initial view.
- A labelled button in the gallery header toggles the resolved theme between `light` and `dark`; it stores the choice immediately and updates the document `theme-color` metadata.
- The resolved value is applied as `data-theme` on `.app-shell` and drives both the gallery and import-flow CSS variables.
- The existing purple accent is preserved in both modes. Light mode restores a warm, high-contrast paper surface, dark text, subtle borders, and legible success/error states.

### Outfits

- The header adds an `Outfits` view beside the garment category filters.
- The app reads `data/outfits.json` locally through a dedicated Vite development API. It returns active outfit records and safely serves their images from `data/outfit-images/`.
- In static mode, the app reads `/wardrobe/outfits.json`. The static export copies each active outfit image into `/wardrobe/outfits/` and rewrites the record URL, so no private filesystem path or unprotected API endpoint is exposed.
- The view renders a responsive lookbook grid. Every card shows its modeled image, name, occasion tags, and the number of garments in the look. It is read-only; editing and generation stay in the local skills/workflow.
- A missing outfit image does not hide the look: the card uses a deliberate empty-state tile. Invalid image paths cannot escape `data/outfit-images/`.

## Data flow

```text
data/outfits.json + data/outfit-images/*.png
  ├─ local: Vite outfit API → React Outfits view
  └─ static export: validated copy → public/wardrobe/outfits.json + outfits/*.png → React Outfits view
```

Garment export behavior remains unchanged: 64 accepted garments and their derived assets are still the only wardrobe catalog data in the protected preview.

## Components and boundaries

- `src/theme.js`: resolves, persists, and toggles a theme without React-specific side effects.
- `src/outfit-source.js`: fetches and validates outfit arrays for local/static modes.
- `scripts/outfit-api.mjs`: narrowly serves the local outfit manifest and images in Vite development only.
- `scripts/static-outfit-export.mjs`: validates and copies static lookbook output atomically.
- `src/App.jsx`: owns view selection, obtains both collections, and renders header controls.
- `src/styles.css` and `src/import-flow.css`: define variable-based light and dark surfaces without changing the import workflow.

## Error handling

- A failed outfits request leaves the garment gallery available and shows a scoped lookbook message when the Outfits view is selected.
- A malformed manifest is rejected by the loader/exporter rather than partially rendered.
- Missing static outfit images produce an explicit fallback card; missing required garment assets keep the existing export failure behavior.

## Tests and verification

- Unit-test theme resolution, persistence, and manual toggle behavior with a fake storage object and media preference.
- Unit-test static outfit export for URL rewriting, asset copy deduplication, missing optional image fallback, and traversal rejection.
- Unit-test local/static outfit source loading and malformed payload rejection.
- Run all Node tests, normal Vite build, static build, `vercel build`, and protected-preview checks after deployment.

## Non-goals

- No remote database, authentication change, automatic outfit generation, or garment editing from the lookbook.
- No original wardrobe or model photos enter Git or a public Vercel deployment.
