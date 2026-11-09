export function resolveThemePreference(storedTheme, prefersDark) {
  if (storedTheme === "dark" || storedTheme === "light") return storedTheme;
  return prefersDark ? "dark" : "light";
}
