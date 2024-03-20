import { appTools, defineConfig } from '@modern-js/app-tools';
import { pluginSvelte } from '@rsbuild/plugin-svelte';
import { webxPlugin } from '@webx-kit/modernjs-plugin';

// https://modernjs.dev/en/configure/app/usage
export default defineConfig({
  plugins: [
    appTools(),
    webxPlugin({
      background: './src/background/index.ts',
      contentScripts: {
        import: './src/content-scripts/index.ts',
        matches: ['<all_urls>'],
      },
    }),
  ],
  builderPlugins: [pluginSvelte()],
  output: {
    disableSvgr: true,
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
