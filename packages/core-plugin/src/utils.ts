import fs from 'node:fs';
import path from 'node:path';
import type { ModifyWebpackChainUtils } from '@rsbuild/core';

export type Override<T, U> = Omit<T, keyof U> & U;

export type WebpackConfig = Parameters<ModifyWebpackChainUtils['webpack']['config']['getNormalizedWebpackOptions']>[0];

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

export async function findUp({ filename, cwd = process.cwd() }: { filename: string; cwd?: string }) {
  const { root } = path.parse(cwd);
  let dir = cwd;
  while (dir && dir !== root) {
    const filePath = path.join(dir, filename);
    try {
      const stats = await fs.promises.stat(filePath);
      if (stats?.isFile()) return filePath;
    } catch {}
    dir = path.dirname(dir);
  }
}
