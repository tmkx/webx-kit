import path from 'node:path';
import { createWebxTest } from '@webx-kit/test-utils/playwright';

export const test = createWebxTest({
  extensionPath: path.resolve(__dirname, '../output'),
});

export const { expect } = test;
