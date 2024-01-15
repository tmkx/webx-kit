import { appTools, defineConfig } from '@modern-js/app-tools';
import { webxPlugin } from '@webx-kit/modernjs-plugin';

// https://modernjs.dev/en/configure/app/usage
export default defineConfig({
  plugins: [
    appTools(),
    webxPlugin({
      background: './demo/background/index.ts',
      contentScripts: './demo/content-scripts/index.ts',
      manifest: './demo/manifest.ts',
    }),
  ],
  source: {
    entriesDir: './demo/pages',
  },
});
