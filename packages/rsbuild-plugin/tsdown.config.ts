import { defineConfig } from 'tsdown';
import { sharedConfig } from '../core-plugin/tsdown.config';

export default defineConfig({
  ...sharedConfig,
  entry: {
    index: './src/index.ts',
    manifest: './src/manifest.ts',
    tailwind: './src/tailwind.ts',
  },
});
