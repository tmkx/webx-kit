import { defineConfig } from 'tsdown';

export default defineConfig({
  outDir: './dist',
  format: 'cjs',
  dts: false,
  clean: true,
  entry: {
    index: './src/index.ts',
  },
});
