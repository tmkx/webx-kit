import { appTools, defineConfig } from '@modern-js/app-tools';
import { webxPlugin } from '@webx-kit/modernjs-plugin';

// https://modernjs.dev/en/configure/app/usage
export default defineConfig({
  plugins: [
    appTools(),
    webxPlugin({
      background: './src/background/index.ts',
      contentScripts: [
        {
          import: './src/content-scripts/index.tsx',
          matches: ['<all_urls>'],
        },
      ],
    }),
  ],
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
