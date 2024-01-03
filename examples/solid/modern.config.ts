import { appTools, defineConfig } from '@modern-js/app-tools';
import { isDev, webxPlugin } from '@webx-kit/modernjs-plugin';

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
    disableSvgr: true,
    disableSourceMap: !isDev(),
    copy: [
      {
        from: './public',
        to: './public',
      },
    ],
  },
  tools: {
    babel(_config, { addPresets, addPlugins }) {
      addPresets(['babel-preset-solid']);
      if (isDev()) {
        addPlugins([['solid-refresh/babel', { bundler: 'webpack5' }]]);
      }
    },
    postcss: {
      postcssOptions: {
        plugins: [require('tailwindcss')],
      },
    },
  },
});
