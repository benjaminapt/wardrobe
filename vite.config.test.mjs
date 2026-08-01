import assert from "node:assert/strict";
import test from "node:test";

import config from "./vite.config.mjs";

test("registers the outfit API before the catch-all import API", () => {
  const names = config({ mode: "test" }).plugins.map((plugin) => plugin.name);

  assert.ok(names.indexOf("wardrobe-outfit-api") < names.indexOf("wardrobe-import-job-api"));
});
