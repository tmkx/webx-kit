import { Options, defineConfig } from 'tsdown';

export const sharedConfig: Options = {
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  outDir: './dist',
  format: 'cjs',
  clean: true,
  dts: true,
};

export default defineConfig({
  ...sharedConfig,
  entry: ['./src/**/*.ts'],
});
