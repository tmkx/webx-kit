import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['./src/*.ts'],
  outDir: './dist',
  format: 'cjs',
  bundle: false,
  clean: true,
  dts: true,
});
