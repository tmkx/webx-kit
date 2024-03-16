import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: './src/index.ts',
    manifest: './src/manifest.ts',
  },
  outDir: './dist',
  format: 'cjs',
  clean: true,
  dts: true,
});
