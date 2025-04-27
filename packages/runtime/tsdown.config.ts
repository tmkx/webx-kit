import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: './src/index.ts',
    'content-scripts': './src/content-scripts/index.ts',
  },
  outDir: './dist',
  format: 'esm',
  clean: true,
  dts: true,
});
