import { appTools, defineConfig } from '@modern-js/app-tools';
import { builderPluginSvelte } from '@webx-kit/modernjs-builder-plugin-svelte';
import { webxPlugin } from '@webx-kit/modernjs-plugin';

// https://modernjs.dev/en/configure/app/usage
export default defineConfig({
  plugins: [
    appTools(),
    webxPlugin({
      background: './src/background/index.ts',
      contentScripts: './src/content-scripts/index.ts',
    }),
  ],
  builderPlugins: [builderPluginSvelte()],
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
