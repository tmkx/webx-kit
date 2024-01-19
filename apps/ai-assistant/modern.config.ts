import { AppUserConfig, appTools, defineConfig } from '@modern-js/app-tools';
import { webxPlugin } from '@webx-kit/modernjs-plugin';

// https://modernjs.dev/en/configure/app/usage
export default defineConfig(() => ({
  plugins: [
    appTools(),
    webxPlugin({
      background: './src/background/index.ts',
      contentScripts: './src/content-scripts/index.tsx',
    }),
  ],
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
        plugins: [require('tailwindcss'), semiPostCSSPlugin],
      },
    },
  },
}));

type AppUserWebpackConfig = AppUserConfig<'webpack'>;
type PostCSSLoaderOptions = AppUserWebpackConfig extends {
  tools?: { postcss?: infer P };
}
  ? Exclude<P, Function | Array<any>>
  : never;
type PostCSSAcceptedPlugin = NonNullable<NonNullable<PostCSSLoaderOptions['postcssOptions']>['plugins']>[number];

const semiPostCSSPlugin: PostCSSAcceptedPlugin = {
  postcss(css) {
    css.walkRules((rule) => {
      const bodyToHostSelectors = rule.selectors
        .filter((selector) => selector.startsWith('body'))
        .map((selector) => {
          if (selector.startsWith('body[')) return selector.replace(/body[(.+?)]/, (_, attr) => `:host(${attr})`);
          return selector.replace('body', `:host`);
        });

      if (bodyToHostSelectors.length > 0) {
        rule.selectors = [...rule.selectors, ...bodyToHostSelectors];
      }
    });
  },
};
