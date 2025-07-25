import fs from 'node:fs';
import path from 'node:path';

export function titleCase(str: string) {
  return str
    .split(/[-_ ]/)
    .map((seg) => seg.replace(/^[a-z]/, (char) => char.toUpperCase()))
    .filter(Boolean)
    .join(' ');
}

export function castArray<T>(v: T | T[]): T[] {
  return Array.isArray(v) ? v : [v];
}
