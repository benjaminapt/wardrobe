import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const OUTFITS_ROOT = "/api/import/outfits";

function json(res, status, value) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(value));
}

function mimeType(file) {
  if (file.endsWith(".jpg") || file.endsWith(".jpeg")) return "image/jpeg";
  if (file.endsWith(".webp")) return "image/webp";
  return "image/png";
}

export function outfitApi() {
  let outfitsPath;
  let imagesDir;

  return {
    name: "wardrobe-outfit-api",
    apply: "serve",
    configResolved(config) {
      const dataDir = path.resolve(config.root, "data");
      outfitsPath = path.join(dataDir, "outfits.json");
      imagesDir = path.join(dataDir, "outfit-images");
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, "http://localhost");
        if (!url.pathname.startsWith(OUTFITS_ROOT)) return next();

        try {
          if (url.pathname === OUTFITS_ROOT && req.method === "GET") {
            const manifest = JSON.parse(await readFile(outfitsPath, "utf8"));
            const outfits = Array.isArray(manifest.outfits) ? manifest.outfits.filter((outfit) => outfit?.status === "active") : [];
            return json(res, 200, outfits);
          }

          const imageMatch = url.pathname.match(/^\/api\/import\/outfits\/([^/]+)$/);
          if (imageMatch && req.method === "GET") {
            const name = imageMatch[1];
            if (path.basename(name) !== name) return json(res, 400, { error: "Invalid outfit image name" });
            const file = path.join(imagesDir, name);
            await stat(file);
            res.statusCode = 200;
            res.setHeader("Content-Type", mimeType(file));
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
            return res.end(await readFile(file));
          }

          return json(res, 404, { error: "Not found" });
        } catch (error) {
          return json(res, error.code === "ENOENT" ? 404 : 500, { error: error.code === "ENOENT" ? "Not found" : "Could not load outfits" });
        }
      });
    },
  };
}
