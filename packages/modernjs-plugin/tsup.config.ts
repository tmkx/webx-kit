import { defineConfig } from 'tsup';
import { sharedConfig } from '../core-plugin/tsup.config';

export default defineConfig({
  ...sharedConfig,
  entry: {
    index: './src/index.ts',
    'shadow-root-loader': './src/plugins/content-scripts/shadow-root-loader.ts',
    manifest: './src/manifest.ts',
  },
});
