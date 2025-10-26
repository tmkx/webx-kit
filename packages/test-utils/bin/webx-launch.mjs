#!/usr/bin/env node

// @ts-check
/// <reference types="@webx-kit/chrome-types" />
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { program } from 'commander';
import kleur from 'kleur';

/**
 * Credit to https://github.com/web-infra-dev/modern.js/blob/4d70724c7d26d60e31b0e12b60851eb4a209ca21/packages/toolkit/utils/src/cli/monorepo.ts#L7-L50
 */
const WORKSPACE_FILES = {
  YARN: 'package.json',
  PNPM: 'pnpm-workspace.yaml',
  LERNA: 'lerna.json',
};

program.option('--path [path]', 'extension path').option('--no-pin', 'pin extension to toolbar');

const opts = program.parse(process.argv).opts();

let extensionPath;

if (opts.path) {
  extensionPath = path.resolve(opts.path);
} else {
  extensionPath = fs.existsSync(path.resolve('output/manifest.json')) ? path.resolve('output') : path.resolve('dist');
}

if (!fs.existsSync(path.resolve(extensionPath, 'manifest.json')))
  throw new Error(`\`${path.join(extensionPath, 'manifest.json')}\` does not exist`);

const dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = findMonorepoRoot(dirname);
const userDataDir = path.resolve(
  monorepoRoot || path.resolve(dirname, '..'),
  'node_modules/.cache/webx-browser-user-dir'
);

// it must be "persisted", otherwise the browser will enable incognito mode
chromium
  .launchPersistentContext(userDataDir, {
    headless: false,
    colorScheme: 'no-preference',
    viewport: null,
    ignoreDefaultArgs: ['--disable-extensions', '--enable-automation'],
    args: [
      '--hide-crash-restore-bubble',
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  })
  .then(async context => {
    console.log(kleur.green('Start successfully'));

    await context.grantPermissions(['local-network-access']);
    const outdatedPages = context.pages();
    const page = await context.newPage();
    await Promise.all(outdatedPages.map(page => page.close()));
    await page.goto(`chrome://extensions/`);

    await page.evaluate(async pin => {
      await chrome.developerPrivate.updateProfileConfiguration({ inDeveloperMode: true });
      if (pin) {
        const extensions = await chrome.developerPrivate.getExtensionsInfo();
        await Promise.all(
          extensions
            .filter(ext => !ext.pinnedToToolbar)
            .map(ext =>
              chrome.developerPrivate.updateExtensionConfiguration({
                extensionId: ext.id,
                pinnedToToolbar: true,
              })
            )
        );
      }
    }, opts.pin);
  })
  .catch(err => {
    console.log(kleur.red('Start failed'), err);
  });

/**
 * @param {string} root
 * @returns {boolean}
 */

function isLerna(root) {
  return fs.existsSync(path.join(root, WORKSPACE_FILES.LERNA));
}
/**
 * @param {string} root
 * @returns {boolean}
 */
function isYarnWorkspaces(root) {
  const pkg = path.join(root, WORKSPACE_FILES.YARN);
  if (!fs.existsSync(pkg)) return false;
  const json = JSON.parse(fs.readFileSync(pkg, 'utf8'));
  return Boolean(json.workspaces?.packages);
}

/**
 * @param {string} root
 * @returns {boolean}
 */
function isPnpmWorkspaces(root) {
  return fs.existsSync(path.join(root, WORKSPACE_FILES.PNPM));
}

/**
 * @param {string} root
 * @returns {boolean}
 */
function isMonorepo(root) {
  return isLerna(root) || isYarnWorkspaces(root) || isPnpmWorkspaces(root);
}

/**
 * @param {string} appDirectory
 * @param {number} maxDepth
 * @returns {string | undefined}
 */
function findMonorepoRoot(appDirectory, maxDepth = 5) {
  let inMonorepo = false;
  let monorepoRoot = appDirectory;

  for (let depth = 0; depth < maxDepth; depth++) {
    if (isMonorepo(appDirectory)) {
      inMonorepo = true;
      break;
    }
    monorepoRoot = path.dirname(appDirectory);
  }

  return inMonorepo ? monorepoRoot : undefined;
}
