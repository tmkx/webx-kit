import { AppUserConfig, appTools, defineConfig } from '@modern-js/app-tools';
import { webxPlugin } from '@webx-kit/modernjs-plugin';

// https://modernjs.dev/en/configure/app/usage
export default defineConfig(() => ({
  plugins: [
    appTools(),
    webxPlugin({
      background: './src/background/index.ts',
      contentScripts: {
        import: './src/content-scripts/index.tsx',
        matches: ['<all_urls>'],
      },
      autoRefreshContentScripts: true,
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
        plugins: [require('tailwindcss'), bodyToHostCSSPlugin],
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
type PostCSSAcceptedPlugin = NonNullable<
  Exclude<NonNullable<PostCSSLoaderOptions['postcssOptions']>, Function>['plugins']
>[number];

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
