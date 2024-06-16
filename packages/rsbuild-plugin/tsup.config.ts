import { defineConfig } from 'tsup';
import { sharedConfig } from '../core-plugin/tsup.config';

export default defineConfig({
  ...sharedConfig,
  entry: {
    index: './src/index.ts',
    manifest: './src/manifest.ts',
    tailwind: './src/tailwind.ts',
  },
  external: ['@rsbuild/shared'],
});
