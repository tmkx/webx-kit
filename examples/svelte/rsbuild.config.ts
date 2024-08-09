import { defineConfig } from '@rsbuild/core';
import { pluginLess } from '@rsbuild/plugin-less';
import { pluginSvelte } from '@rsbuild/plugin-svelte';
import { webxPlugin } from '@webx-kit/rsbuild-plugin';

export default defineConfig({
  plugins: [
    pluginLess(),
    pluginSvelte(),
    webxPlugin({
      background: './src/background/index.ts',
      contentScripts: {
        import: './src/content-scripts/index.ts',
        matches: ['<all_urls>'],
      },
    }),
  ],
  source: {
    entry: {
      options: './src/pages/options/index.ts',
      popup: './src/pages/popup/index.ts',
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
