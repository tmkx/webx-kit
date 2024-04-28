import defaultTheme from 'tailwindcss/defaultTheme';

export function convertToPx<T>(theme: T, base = 16): T {
  if (typeof theme === 'string') return theme.replace(/(.+)rem$/, (_, value) => `${Number(value) * base}px`) as T;
  if (typeof theme !== 'object' || theme == null || Object.keys(theme).length === 0) return theme;
  if (Array.isArray(theme)) return theme.map((value) => convertToPx(value, base)) as T;
  return Object.fromEntries(Object.entries(theme).map(([key, value]) => [key, convertToPx(value, base)])) as T;
}

export function getPixelUnitDefaultTheme(base = 16) {
  return convertToPx(defaultTheme, base);
}
