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
        import: './demo/content-scripts/index.tsx',
        matches: ['<all_urls>'],
      },
      pages: {
        jotai: './demo/pages/jotai/index.tsx',
        'jotai-2': './demo/pages/jotai-2/index.tsx',
        'jotai-clear': './demo/pages/jotai-clear/index.tsx',
        unstorage: './demo/pages/unstorage/index.tsx',
        'unstorage-2': './demo/pages/unstorage-2/index.tsx',
      },
    }),
  ],
  output: {
    distPath: { root: './output' },
    overrideBrowserslist: ['last 2 Chrome versions'],
  },
});
