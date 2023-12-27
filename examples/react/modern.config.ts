import { appTools, defineConfig, webpack as webpackNS } from '@modern-js/app-tools';
import { webxPlugin } from '@webx-kit/modernjs-plugin';

// const isDev = process.env.NODE_ENV === 'development';

// https://modernjs.dev/en/configure/app/usage
export default defineConfig({
  plugins: [
    appTools(),
    webxPlugin({
      background: './src/background/index.ts',
      contentScripts: './src/content-scripts/index.tsx',
    }),
  ],
  output: {
    polyfill: 'off',
  },
});
