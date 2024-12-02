import { defineConfig } from '@rsbuild/core';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginLess } from '@rsbuild/plugin-less';
import { pluginSolid } from '@rsbuild/plugin-solid';
import { webxPlugin } from '@webx-kit/rsbuild-plugin';

export default defineConfig({
  plugins: [
    pluginBabel({
      include: /\.(?:jsx|tsx)$/,
    }),
    pluginLess(),
    pluginSolid(),
    webxPlugin({
      background: './src/background/index.ts',
      contentScripts: {
        import: './src/content-scripts/index.tsx',
        matches: ['<all_urls>'],
      },
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
