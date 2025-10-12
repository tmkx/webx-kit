import child_process from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { $ } from 'execa';
import kleur from 'kleur';

interface Dependency {
  from: string;
  version: string;
  path: string;
}

interface Project {
  name: string;
  version: string;
  path: string;
  dependencies?: Record<string, Dependency>;
  devDependencies?: Record<string, Dependency>;
}

const templatesDir = path.resolve(import.meta.dirname, 'templates');
if (fs.existsSync(templatesDir)) await fs.promises.rm(templatesDir, { recursive: true });

const templates: Project[] = JSON.parse(
  child_process.execSync(`pnpm ls --filter="@webx-kit/template-*" --only-projects --json`, {
    encoding: 'utf8',
  })
);

const PNPM_WORKSPACE_PROTOCOL = /^workspace:\*?/;

for (const template of templates) {
  console.log(kleur.gray('Processing template:'), kleur.green(template.name));
  const templateDirname = path.basename(template.path);
  const templateFiles = await $`git ls-files ${template.path}`.then(({ stdout }) => stdout.split('\n'));

  for (const srcFile of templateFiles) {
    const targetFile = path.join(templatesDir, templateDirname, path.relative(template.path, srcFile));
    const targetFileDir = path.dirname(targetFile);
    if (!targetFileDir.startsWith(templatesDir)) throw new Error(`Invalid template file path: ${srcFile}`);
    if (!fs.existsSync(targetFileDir)) await fs.promises.mkdir(targetFileDir, { recursive: true });
    await fs.promises.copyFile(srcFile, targetFile);
  }

  const pkgJsonPath = path.resolve(templatesDir, templateDirname, 'package.json');
  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));

  (['dependencies', 'devDependencies'] as const).forEach((depType) => {
    Object.entries(template[depType] || {}).forEach(([depName, dep]) => {
      const prevValue = pkgJson[depType][depName];
      if (!PNPM_WORKSPACE_PROTOCOL.test(prevValue)) return;
      pkgJson[depType][depName] = prevValue.replace(PNPM_WORKSPACE_PROTOCOL, '') + getPackageVersion(dep.path);
    });
  });

  fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
}

var packageVersionsCache: Map<string, string> | undefined;
function getPackageVersion(pkgPath: string) {
  if (!packageVersionsCache) packageVersionsCache = new Map();
  const cacheValue = packageVersionsCache.get(pkgPath);
  if (cacheValue) return cacheValue;
  const pkgJson = JSON.parse(fs.readFileSync(path.join(pkgPath, 'package.json'), { encoding: 'utf8' }));
  const version = pkgJson.version;
  packageVersionsCache.set(pkgPath, version);
  return version;
}
