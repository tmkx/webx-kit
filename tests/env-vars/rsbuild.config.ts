import { defineConfig } from '@rsbuild/core';
import { webxPlugin } from '@webx-kit/rsbuild-plugin';

export default defineConfig({
  plugins: [
    webxPlugin({
      background: './src/background/index.ts',
    }),
  ],
  output: {
    ...(process.env.DIST ? { distPath: { root: process.env.DIST } } : null),
  },
});
