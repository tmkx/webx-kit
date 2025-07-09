import { defineConfig } from 'tsdown';

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  outDir: './dist',
  format: 'cjs',
  clean: true,
  dts: true,
  unbundle: true,
  entry: ['./src/**/*.ts'],
});
