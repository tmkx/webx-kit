import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: './src/index.ts',
    'shadow-root-loader': './src/plugins/content-scripts/shadow-root-loader.ts',
    manifest: './src/manifest.ts',
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  outDir: './dist',
  format: 'cjs',
  clean: true,
  dts: true,
  minifySyntax: true,
});
