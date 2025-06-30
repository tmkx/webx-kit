#!/usr/bin/env node
// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import prompts, { Choice } from 'prompts';
import kleur, { Kleur } from 'kleur';

const debug = require('debug')('webx');

interface TemplateItem extends Choice {
  color: keyof Kleur;
}

export const templateLists: TemplateItem[] = [
  { title: 'React', value: 'react', color: 'magenta' },
  { title: 'Vue', value: 'vue', color: 'green' },
  { title: 'Solid', value: 'solid', color: 'blue' },
  { title: 'Svelte', value: 'svelte', color: 'yellow' },
];

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
  const targetDir = path.resolve(process.cwd(), name);
  debug({ targetDir });
  if (fs.existsSync(targetDir)) {
    if (isForce) {
      await fs.promises.rm(targetDir, { recursive: true });
    } else {
      console.error(kleur.red('Error:'), `${name} directory is not empty`);
      return;
    }
  }

  const templateDir = path.resolve(__dirname, '../templates');

  await fs.promises.cp(path.resolve(templateDir, template), targetDir, { recursive: true });

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
