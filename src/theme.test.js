import assert from "node:assert/strict";
import test from "node:test";

import { THEME_STORAGE_KEY, persistTheme, resolveTheme, themeColor, toggleTheme } from "./theme.js";

function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  };
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

test("returns browser chrome colors that match the resolved theme", () => {
  assert.equal(themeColor("dark"), "#0a0a0c");
  assert.equal(themeColor("light"), "#f4f0e8");
});
