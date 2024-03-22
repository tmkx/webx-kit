import fs from 'node:fs';
import path from 'node:path';
import { assert, expect, test } from 'vitest';
import { findMonorepoRoot } from '@modern-js/utils';
import { templateLists } from '../src/index';
import { updateWorkspaceReferences } from '../src/utils';

const root = findMonorepoRoot(__dirname);
assert(root);

test('ensure template exists', async () => {
  for (const template of templateLists) {
    expect(fs.existsSync(path.resolve(root, 'examples', template.value, 'package.json'))).toBeTruthy();
  }
});

test('updateWorkspaceReferences', async () => {
  const packageJson = await updateWorkspaceReferences(root, path.resolve(root, 'examples/svelte/package.json'));
  expect(JSON.stringify(packageJson)).not.toContain('workspace:');
});
