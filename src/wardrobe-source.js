export async function loadWardrobe({ fetchImpl = fetch, staticMode = false } = {}) {
  const url = staticMode ? "/wardrobe/library.json" : "/api/import/wardrobe";
  const response = await fetchImpl(url, { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load the wardrobe.");
  const items = await response.json();
  if (!Array.isArray(items)) throw new Error("Wardrobe response must be an array.");
  return items;
}
