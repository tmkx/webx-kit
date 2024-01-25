#!/usr/bin/env node

// @ts-check
/// <reference types="@webx-kit/chrome-types" />
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chalk, fs, findMonorepoRoot } from '@modern-js/utils';
import commander from '@modern-js/utils/commander';
import { chromium } from '@playwright/test';

commander.program.option('--path <path>', 'extension path', 'dist').option('--no-pin', 'pin extension to toolbar');

const opts = commander.program.parse(process.argv).opts();

const extensionPath = path.resolve(opts.path);
if (!fs.existsSync(extensionPath)) throw new Error(`\`${extensionPath}\` does not exist`);
if (!fs.statSync(extensionPath).isDirectory()) throw new Error(`\`${extensionPath}\` is not a directory`);

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
    args: ['--hide-crash-restore-bubble', `--load-extension=${extensionPath}`],
  })
  .then(async (context) => {
    console.log(chalk.green`Start successfully`);

    const outdatedPages = context.pages();
    const page = await context.newPage();
    await Promise.all(outdatedPages.map((page) => page.close()));
    await page.goto(`chrome://extensions/`);

    await page.evaluate(async (pin) => {
      await chrome.developerPrivate.updateProfileConfiguration({ inDeveloperMode: true });
      if (pin) {
        const extensions = await chrome.developerPrivate.getExtensionsInfo();
        await Promise.all(
          extensions
            .filter((ext) => !ext.pinnedToToolbar)
            .map((ext) =>
              chrome.developerPrivate.updateExtensionConfiguration({
                extensionId: ext.id,
                pinnedToToolbar: true,
              })
            )
        );
      }
    }, opts.pin);
  })
  .catch((err) => {
    console.log(chalk.red`Start failed`, err);
  });
