import { isDev } from '@modern-js/utils';
import { merge } from '@modern-js/utils/lodash';
import { RsbuildPlugin } from '@rsbuild/shared';
import type { CompileOptions } from 'svelte/compiler';
import sveltePreprocess from 'svelte-preprocess';

export type AutoPreprocessOptions = NonNullable<Parameters<typeof sveltePreprocess>[0]>;

export interface LoaderOptions {
  compilerOptions?: CompileOptions;
  hotOptions?: {
    /** preserve local component state */
    preserveLocalState?: boolean;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface PluginSvelteOptions {
  /**
   * @see {@link https://github.com/sveltejs/svelte-loader Svelte Loader}
   */
  loaderOptions?: LoaderOptions;
  /**
   * @see {@link https://github.com/sveltejs/svelte-preprocess Svelte Preprocess}
   */
  preprocessOptions?: AutoPreprocessOptions;
}

export const builderPluginSvelte = ({ loaderOptions, preprocessOptions }: PluginSvelteOptions = {}): RsbuildPlugin => {
  return {
    name: '@webx-kit/modernjs-builder-plugin-svelte',
    remove: ['builder-plugin-react', 'builder-plugin-antd', 'builder-plugin-arco'],
    setup(api) {
      // api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
      //   return mergeRsbuildConfig(config, {
      //     output: {
      //       disableSvgr: true,
      //     },
      //   });
      // });

      api.modifyBundlerChain((chain) => {
        chain.resolve.extensions.add('.svelte');

        const svelteLoaderOptions = merge<LoaderOptions, LoaderOptions>(
          {
            compilerOptions: {
              dev: isDev(),
            },
            hotReload: isDev(),
            hotOptions: {
              // Prevent preserving local component state
              preserveLocalState: true,
            },
          },
          loaderOptions || {}
        );
        const sveltePreprocessOptions = merge<AutoPreprocessOptions, AutoPreprocessOptions>(
          {},
          preprocessOptions || {}
        );

        chain.module
          .rule('svelte')
          .test(/\.svelte$/)
          .use('svelte')
          .loader(require.resolve('svelte-loader'))
          .options({
            ...svelteLoaderOptions,
            preprocess: sveltePreprocess(sveltePreprocessOptions),
          });
      });
    },
  };
};
