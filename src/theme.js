export const THEME_STORAGE_KEY = "open-wardrobe-theme-v1";

export function resolveTheme({ storage, prefersDark }) {
  const saved = storage?.getItem(THEME_STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return prefersDark ? "dark" : "light";
}

export function toggleTheme(theme) {
  return theme === "dark" ? "light" : "dark";
}

export function persistTheme({ storage, theme }) {
  storage?.setItem(THEME_STORAGE_KEY, theme);
}
