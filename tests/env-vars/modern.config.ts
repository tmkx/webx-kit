import { appTools, defineConfig } from '@modern-js/app-tools';
import { webxPlugin } from '@webx-kit/modernjs-plugin';

// https://modernjs.dev/en/configure/app/usage
export default defineConfig({
  plugins: [
    appTools(),
    webxPlugin({
      background: './src/background/index.ts',
    }),
  ],
  output: {
    ...(process.env.DIST ? { distPath: { root: process.env.DIST } } : null),
    disableTsChecker: true,
  },
});
