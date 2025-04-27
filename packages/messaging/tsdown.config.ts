import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['./src/*.ts'],
  outDir: './dist',
  format: 'cjs',
  clean: true,
  dts: true,
});
