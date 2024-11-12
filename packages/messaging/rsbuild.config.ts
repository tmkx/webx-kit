import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { webxPlugin } from '@webx-kit/rsbuild-plugin';

export default defineConfig({
  plugins: [
    pluginReact(),
    webxPlugin({
      background: './demo/background/index.ts',
      manifest: './demo/manifest.ts',
      contentScripts: {
        import: './demo/content-scripts/index.ts',
        matches: ['<all_urls>'],
      },
    }),
  ],
  source: {
    entry: {
      options: './demo/pages/options/index.ts',
      popup: './demo/pages/popup/index.ts',
    },
  },
  output: {
    distPath: { root: './output' },
    overrideBrowserslist: ['last 2 Chrome versions'],
  },
});
