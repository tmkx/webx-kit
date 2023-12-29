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
    disableSourceMap: !isDev(),
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
        plugins: [
          require('tailwindcss'),
          {
            postcss(css) {
              css.walkRules((rule) => {
                const bodyToHostSelectors = rule.selectors
                  .filter((selector) => selector.startsWith('body'))
                  .map((selector) => {
                    if (selector.startsWith('body['))
                      return selector.replace(/body[(.+?)]/, (_, attr) => `:host(${attr})`);
                    return selector.replace('body', `:host`);
                  });

                if (bodyToHostSelectors.length > 0) {
                  rule.selectors = [...rule.selectors, ...bodyToHostSelectors];
                }
              });
            },
          },
        ],
      },
    },
  },
});
