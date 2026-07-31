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
