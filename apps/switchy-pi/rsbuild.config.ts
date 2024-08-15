import { defineConfig } from '@rsbuild/core';
import { pluginLess } from '@rsbuild/plugin-less';
import { pluginReact } from '@rsbuild/plugin-react';
import { webxPlugin } from '@webx-kit/rsbuild-plugin';

export default defineConfig({
  plugins: [
    pluginLess(),
    pluginReact(),
    webxPlugin({
      background: './src/background/index.ts',
    }),
  ],
  source: {
    entry: {
      options: './src/pages/options/index.tsx',
      popup: './src/pages/popup/index.tsx',
    },
  },
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
        plugins: [require('tailwindcss')],
      },
    },
  },
});
