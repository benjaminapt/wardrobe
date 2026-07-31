import assert from "node:assert/strict";
import test from "node:test";

import { loadWardrobe } from "./wardrobe-source.js";

function response({ ok = true, payload = [] } = {}) {
  return { ok, json: async () => payload };
}

test("static mode loads the exported wardrobe snapshot", async () => {
  const requested = [];
  const fetchImpl = async (url) => {
    requested.push(url);
    return response({ payload: [{ id: "static-item" }] });
  };

  const items = await loadWardrobe({ fetchImpl, staticMode: true });

  assert.deepEqual(items, [{ id: "static-item" }]);
  assert.deepEqual(requested, ["/wardrobe/library.json"]);
});

test("local mode loads the filesystem-backed import API", async () => {
  const requested = [];
  const fetchImpl = async (url) => {
    requested.push(url);
    return response({ payload: [{ id: "local-item" }] });
  };

  const items = await loadWardrobe({ fetchImpl, staticMode: false });

  assert.deepEqual(items, [{ id: "local-item" }]);
  assert.deepEqual(requested, ["/api/import/wardrobe"]);
});

test("reports a failed wardrobe response", async () => {
  const fetchImpl = async () => response({ ok: false });

  await assert.rejects(
    () => loadWardrobe({ fetchImpl, staticMode: true }),
    /Could not load the wardrobe/,
  );
});

test("rejects a malformed wardrobe payload", async () => {
  const fetchImpl = async () => response({ payload: { items: [] } });

  await assert.rejects(
    () => loadWardrobe({ fetchImpl, staticMode: false }),
    /Wardrobe response must be an array/,
  );
});
