import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { webxPlugin } from '@webx-kit/rsbuild-plugin';

export default defineConfig({
  plugins: [pluginReact(), webxPlugin()],
  source: {
    entry: {
      options: './src/pages/options/index.tsx',
      popup: './src/pages/popup/index.tsx',
    },
  },
  tools: {
    postcss: {
      postcssOptions: {
        plugins: [require('tailwindcss')],
      },
    },
  },
});
