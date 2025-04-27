import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['./src/*.ts'],
  outDir: './dist',
  format: 'esm',
  clean: true,
  dts: true,
});
