# Private Vercel Preview Design

**Date:** 2026-07-31  
**Status:** Approved

## Goal

Give Benjamín a persistent URL for viewing his current Wardrobe catalog from any device while keeping access restricted to his Vercel account.

## Scope

The first hosted version is a read-oriented snapshot of the current local catalog. It preserves the existing local-first import workflow and does not turn Vercel into the system of record.

Included:

- A persistent Vercel preview deployment.
- Vercel Authentication in front of the preview.
- The current accepted wardrobe catalog and its derived garment images.
- Local edits already present in the working tree, including the Antigravity visual changes.
- A repeatable local export-and-deploy path for refreshing the hosted snapshot.

Not included:

- Uploading original gallery photos.
- Committing private wardrobe data or images to Git.
- Running image detection, garment extraction, or modeled-image generation on Vercel.
- Multi-user accounts, subscriptions, billing, or customer onboarding.
- A production domain or public production deployment.

## Architecture

The local application remains authoritative. Before deployment, an export step prepares a static web-safe snapshot containing the catalog JSON and only the derived images referenced by accepted items. The app loads its existing local API when available and falls back to the exported static snapshot when that API is unavailable on Vercel.

The generated snapshot is ignored by Git. A production build copies it into the build output, and the resulting prebuilt artifact is uploaded directly to a Vercel preview project. The repository remains connected to the Vercel project for ownership and project management, but Git pushes are not the mechanism for publishing private catalog data.

## Data Flow

1. Read `data/library.json` locally.
2. Validate each accepted item and resolve its garment and modeled-image references.
3. Copy only the referenced derived images into a generated static snapshot.
4. Rewrite image URLs in the exported catalog to static deployment paths.
5. Build the Vite application.
6. Deploy the build output as a Vercel preview.
7. Require Vercel Authentication before serving the deployment.

Local imports continue to use the existing `/api/import/*` endpoints and local filesystem. Hosted editing remains browser-local where already supported; deleting or importing on the hosted preview must not mutate the local source catalog.

## Privacy and Access

- Original gallery photos are excluded from the export.
- Only accepted catalog metadata and derived garment/model images are included.
- Generated deployment assets remain ignored by Git.
- The preview uses Vercel Authentication with Standard Protection, so only a Vercel user with access to the project can open it.
- The stable address shared with Benjamín is a protected preview URL, not the public production domain.
- Protection is verified from a signed-out request before the URL is handed off.

## Failure Handling

- Export stops if the library is invalid or a referenced required garment image is missing.
- Missing optional modeled images are omitted without blocking deployment.
- Build failure prevents deployment.
- A deployment that does not challenge signed-out access is not accepted as private and is not handed off.
- The previous working preview remains available if a refresh fails.

## Verification

The deployment is complete when:

- The local build succeeds.
- The hosted preview requests Vercel authentication for a signed-out visitor.
- An authenticated visit loads all accepted catalog items.
- No garment image is broken.
- Original gallery photos are absent from the deployment artifact.
- Local development still loads the filesystem-backed catalog and import API.

## Refresh Workflow

After local catalog changes, rerun the export, build, validation, and preview deployment. The refresh is intentionally manual in this first version because the private catalog assets are not stored in Git or a hosted database.

