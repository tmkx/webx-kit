import { defineConfig } from 'tsup';
import { sharedConfig } from '../core-plugin/tsup.config';

export default defineConfig({
  ...sharedConfig,
  entry: {
    index: './src/index.ts',
    manifest: './src/manifest.ts',
  },
  external: ['@rsbuild/shared'],
});
