import assert from "node:assert/strict";
import test from "node:test";

import { loadOutfits } from "./outfit-source.js";

function response({ ok = true, payload = [] } = {}) {
  return { ok, json: async () => payload };
}

test("static mode loads the exported outfit snapshot", async () => {
  const requested = [];
  const outfits = await loadOutfits({
    staticMode: true,
    fetchImpl: async (url) => {
      requested.push(url);
      return response({ payload: [{ id: "look", image: null }] });
    },
  });

  assert.deepEqual(outfits, [{ id: "look", image: null }]);
  assert.deepEqual(requested, ["/wardrobe/outfits.json"]);
});

test("local mode loads outfits from the local API", async () => {
  const requested = [];
  await loadOutfits({
    fetchImpl: async (url) => {
      requested.push(url);
      return response({ payload: [{ id: "look" }] });
    },
  });

  assert.deepEqual(requested, ["/api/import/outfits"]);
});

test("rejects unavailable and malformed outfit payloads", async () => {
  await assert.rejects(
    () => loadOutfits({ fetchImpl: async () => response({ ok: false }) }),
    /Could not load outfits/,
  );
  await assert.rejects(
    () => loadOutfits({ fetchImpl: async () => response({ payload: { outfits: [] } }) }),
    /Outfits response must be an array/,
  );
});
