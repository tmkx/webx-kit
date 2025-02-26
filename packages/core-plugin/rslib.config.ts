import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      source: {
        entry: {
          index: './src/**/*.ts',
        },
        define: {
          'process.env.NODE_ENV': JSON.stringify('production'),
        },
      },
      format: 'cjs',
      bundle: false,
      dts: true,
    },
  ],
});
