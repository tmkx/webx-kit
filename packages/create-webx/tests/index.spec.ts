import fs from 'node:fs';
import path from 'node:path';
import { execaSync } from 'execa';
import { assert, expect, test } from 'vitest';
import { templateLists } from '../src/index';
import { updateWorkspaceReferences } from '../src/utils';

const root = path.dirname(execaSync('pnpm', ['-w', 'root']).stdout);
assert(root);

test('ensure template exists', async () => {
  for (const template of templateLists) {
    expect(fs.existsSync(path.resolve(root, 'templates', template.value, 'package.json'))).toBeTruthy();
  }
});

test('updateWorkspaceReferences', async () => {
  const packageJson = await updateWorkspaceReferences(root, path.resolve(root, 'templates/svelte/package.json'));
  expect(JSON.stringify(packageJson)).not.toContain('workspace:');
});
