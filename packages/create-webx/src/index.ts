#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execa } from 'execa';
import prompts, { Choice } from 'prompts';
import kleur, { Kleur } from 'kleur';
import { debug, updateWorkspaceReferences } from './utils';

interface TemplateItem extends Choice {
  color: keyof Kleur;
}

export const templateLists: TemplateItem[] = [
  { title: 'React', value: 'react', color: 'magenta' },
  { title: 'Vue', value: 'vue', color: 'green' },
  { title: 'Solid', value: 'solid', color: 'blue' },
  { title: 'Svelte', value: 'svelte', color: 'yellow' },
];

const folderName = 'webx-kit';

async function main() {
  const isForce = process.argv.includes('--force');
  const { name, template } = await prompts(
    [
      {
        type: 'text',
        name: 'name',
        message: 'Project name',
        initial: 'webx-project',
      },
      {
        name: 'template',
        type: 'select',
        message: 'Template',
        choices: templateLists.map(({ color, title, ...choice }) => ({ ...choice, title: kleur[color](title) })),
      },
    ],
    {
      onSubmit(prompt, answer) {
        if (prompt.name === 'name' && isForce) {
          const targetDir = path.resolve(process.cwd(), answer);
          if (fs.existsSync(targetDir))
            console.log(
              kleur.yellow(`⚠️ You are running with --force, this will remove all files under \`${answer}\`!!!`)
            );
        }
      },
    }
  );
  debug({ name, template });
  if (!name || !template) return;
  const tempDir = os.tmpdir();
  const repoDir = path.resolve(tempDir, folderName);
  const targetDir = path.resolve(process.cwd(), name);
  debug({ repoDir, targetDir });
  debug('repoDir exists', fs.existsSync(repoDir));
  if (fs.existsSync(targetDir)) {
    if (isForce) {
      await fs.promises.rm(targetDir, { recursive: true });
    } else {
      console.error(kleur.red('Error:'), `${name} directory is not empty`);
      return;
    }
  }
  let needClone = true;
  if (fs.existsSync(repoDir)) {
    const { stdout: lastCommitDate } = await execa('git', ['log', '-1', '--format=%cd'], { cwd: repoDir });
    if (!isForce && Date.now() < new Date(lastCommitDate).valueOf() + 3 * 24 * 60 * 60 * 1000) {
      needClone = false; // cached for 3 days
    } else {
      await fs.promises.rm(repoDir, { recursive: true });
    }
  }
  if (needClone) {
    console.log(kleur.dim('Clone...'));
    await execa('git', ['clone', 'https://github.com/tmkx/webx-kit.git', '--depth', '1', folderName], {
      cwd: tempDir,
      stdio: process.env.DEBUG ? 'inherit' : 'ignore',
    });
  }

  const { stdout: lastCommitHash } = await execa('git', ['rev-parse', 'HEAD'], { cwd: repoDir });
  debug({ lastCommitHash });

  await fs.promises.cp(path.resolve(repoDir, 'templates', template), targetDir, { recursive: true });
  const resolvedPackageJson = await updateWorkspaceReferences(repoDir, path.resolve(targetDir, 'package.json'));
  await fs.promises.writeFile(path.resolve(targetDir, 'package.json'), JSON.stringify(resolvedPackageJson, null, 2));

  const detectedPackageManger = process.env.npm_config_user_agent?.match(/^(yarn|pnpm|npm)\//)?.[1];
  debug({ detectedPackageManger });
  const packageManager = detectedPackageManger || 'npm';

  console.log();
  console.log(kleur.green('WebX Project Created'));
  console.log(`${kleur.dim('>')} ${kleur.grey(`cd ${name}`)}`);
  console.log(
    `${kleur.dim('>')} ${kleur.grey(
      packageManager === 'pnpm' ? `pnpm i` : packageManager === 'yarn' ? `yarn` : `npm i`
    )}`
  );
}

if (require.main === module) {
  main().catch(console.error);
}
