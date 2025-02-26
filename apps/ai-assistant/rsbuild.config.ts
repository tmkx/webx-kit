import { defineConfig, PostCSSOptions } from '@rsbuild/core';
import { pluginLess } from '@rsbuild/plugin-less';
import { pluginReact } from '@rsbuild/plugin-react';
import { webxPlugin } from '@webx-kit/rsbuild-plugin';

export default defineConfig(() => ({
  plugins: [
    pluginLess(),
    pluginReact(),
    webxPlugin({
      background: './src/background/index.ts',
      contentScripts: {
        import: './src/content-scripts/index.tsx',
        matches: ['<all_urls>'],
      },
      autoRefreshContentScripts: true,
    }),
  ],
  source: {
    entry: {
      options: './src/pages/options/index.tsx',
      popup: './src/pages/popup/index.tsx',
    },
  },
  output: {
    copy: [
      {
        from: './public',
        to: './public',
      },
    ],
    overrideBrowserslist: ['last 2 Chrome versions'],
  },
  tools: {
    postcss: {
      postcssOptions: {
        plugins: [require('tailwindcss'), bodyToHostCSSPlugin],
      },
    },
  },
}));

type PostCSSAcceptedPlugin = NonNullable<PostCSSOptions['plugins']>[number];

const bodyToHostCSSPlugin: PostCSSAcceptedPlugin = {
  postcss(css) {
    css.walkRules((rule) => {
      const bodyToHostSelectors = rule.selectors
        .filter((selector) => selector.startsWith('body'))
        .map((selector) => {
          if (selector.startsWith('body[')) return selector.replace(/body[(.+?)]/g, (_, attr) => `:host(${attr})`);
          return selector.replace('body', ':host');
        });

      const rootToHostSelectors = rule.selectors
        .filter((selector) => selector.includes(':root'))
        .map((selector) => selector.replaceAll(':root', ':host'));

      if (bodyToHostSelectors.length > 0 || rootToHostSelectors.length > 0) {
        rule.selectors = [...rule.selectors, ...bodyToHostSelectors, ...rootToHostSelectors];
      }
    });
  },
};
