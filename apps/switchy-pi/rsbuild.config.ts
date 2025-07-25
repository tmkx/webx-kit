import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { webxPlugin } from '@webx-kit/rsbuild-plugin';

export default defineConfig({
  plugins: [
    pluginReact(),
    webxPlugin({
      background: './src/background/index.ts',
      pages: {
        options: './src/pages/options/index.tsx',
        popup: './src/pages/popup/index.tsx',
      },
    }),
  ],
  output: {
    copy: [
      {
        from: './public',
        to: './public',
      },
    ],
  },
  tools: {
    postcss: {
      postcssOptions: {
        plugins: [require('@tailwindcss/postcss')],
      },
    },
  },
});
