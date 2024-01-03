import { appTools, defineConfig } from '@modern-js/app-tools';
import { isDev, webxPlugin } from '@webx-kit/modernjs-plugin';
import { builderPluginVue } from '@modern-js/builder-plugin-vue';

// https://modernjs.dev/en/configure/app/usage
export default defineConfig({
  plugins: [
    appTools(),
    webxPlugin({
      background: './src/background/index.ts',
      contentScripts: './src/content-scripts/index.tsx',
    }),
  ],
  builderPlugins: [builderPluginVue()],
  source: {
    define: {
      // TODO: remove next line after https://github.com/web-infra-dev/modern.js/pull/5185 is merged
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false),
    },
  },
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
