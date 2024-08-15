import fs from 'node:fs';
import path from 'node:path';
import { glob } from 'fast-glob';
import type { PackageJson } from 'type-fest';

export const debug = require('debug')('webx');

export async function findPackages(root: string) {
  return await glob('**/package.json', { cwd: root, absolute: true, onlyFiles: true, deep: 3 })
    .then((files) =>
      files.map((pkgFile) => fs.promises.readFile(pkgFile, 'utf8').then((content) => JSON.parse(content)))
    )
    .then((pkgJson) => Promise.all(pkgJson))
    .then((packagesData) => Object.fromEntries<PackageJson>(packagesData.map((pkg) => [pkg.name, pkg])));
}

export async function updateWorkspaceReferences(root: string, packageJsonPath: string) {
  const workspaceData = await fs.promises.readFile(path.resolve(root, 'pnpm-workspace.yaml'), 'utf8');
  const packagesData = await findPackages(root);
  return JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf8'), (key, value) => {
    if (!key || typeof value !== 'string') return value;
    if (value.startsWith('workspace:')) return `${value.slice('workspace:'.length)}${packagesData[key].version}`;
    if (value.startsWith('catalog:')) {
      const catalogKey = `'${key}':`;
      const catalogIndex = workspaceData.indexOf(catalogKey);
      if (catalogIndex === -1) throw new Error(`Cannot find catalog "${key}"`);
      const catalogEndIndex = workspaceData.indexOf('\n', catalogIndex);
      if (catalogEndIndex === -1) throw new Error(`Cannot find catalog "${key}"`);
      return workspaceData.slice(catalogIndex + catalogKey.length, catalogEndIndex).trim();
    }
    return value;
  });
}
