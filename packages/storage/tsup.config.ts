import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['./src/*.ts'],
  outDir: './dist',
  format: 'esm',
  clean: true,
  dts: true,
});
