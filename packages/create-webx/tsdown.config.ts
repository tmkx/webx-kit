import { defineConfig } from 'tsdown';
import { sharedConfig } from '../core-plugin/tsdown.config';

export default defineConfig({
  ...sharedConfig,
  entry: {
    index: './src/index.ts',
  },
  format: 'cjs',
  dts: false,
});
