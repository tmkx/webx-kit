export function titleCase(str: string) {
  return str
    .split(/[-_ ]/)
    .map((seg) => seg.replace(/^[a-z]/, (char) => char.toUpperCase()))
    .filter(Boolean)
    .join(' ');
}
