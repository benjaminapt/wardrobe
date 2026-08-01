export async function loadOutfits({ fetchImpl = fetch, staticMode = false } = {}) {
  const response = await fetchImpl(staticMode ? "/wardrobe/outfits.json" : "/api/import/outfits", { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load outfits.");
  const outfits = await response.json();
  if (!Array.isArray(outfits)) throw new Error("Outfits response must be an array.");
  return outfits;
}
