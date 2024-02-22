import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: './src/index.ts',
    'shadow-root-loader': './src/plugins/content-scripts/shadow-root-loader.js',
    manifest: './src/manifest.ts',
  },
  outDir: './dist',
  format: 'cjs',
  clean: true,
  dts: true,
});
