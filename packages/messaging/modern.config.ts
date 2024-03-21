import { appTools, defineConfig } from '@modern-js/app-tools';
import { webxPlugin } from '@webx-kit/modernjs-plugin';

// https://modernjs.dev/en/configure/app/usage
export default defineConfig({
  plugins: [
    appTools(),
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
    entriesDir: './demo/pages',
  },
  output: {
    distPath: { root: './output' },
    overrideBrowserslist: ['last 2 Chrome versions'],
  },
});
