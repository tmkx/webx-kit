import fs from 'node:fs';
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

export async function updateWorkspaceReferences(root: string, path: string) {
  const packagesData = await findPackages(root);
  return JSON.parse(await fs.promises.readFile(path, 'utf8'), (key, value) => {
    if (!key || typeof value !== 'string' || !value.startsWith('workspace:')) return value;
    return `${value.slice('workspace:'.length)}${packagesData[key].version}`;
  });
}
