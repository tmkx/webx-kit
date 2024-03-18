import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['./src/*.ts'],
  outDir: './dist',
  format: 'cjs',
  clean: true,
  dts: true,
});
