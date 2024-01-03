import type { AppTools, UserConfig } from '@modern-js/app-tools';
import { isDev } from '@modern-js/utils';
import { merge } from '@modern-js/utils/lodash';
import type { CompileOptions } from 'svelte/compiler';
import sveltePreprocess from 'svelte-preprocess';

export type AutoPreprocessOptions = NonNullable<Parameters<typeof sveltePreprocess>[0]>;

type BuilderPlugin = NonNullable<UserConfig<AppTools>['builderPlugins']>[number];

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

export const builderPluginSvelte = ({ loaderOptions, preprocessOptions }: PluginSvelteOptions = {}): BuilderPlugin => {
  return {
    name: '@webx-kit/modernjs-builder-plugin-svelte',
    remove: ['builder-plugin-react', 'builder-plugin-antd', 'builder-plugin-arco'],
    setup(api) {
      api.modifyBuilderConfig((config, { mergeBuilderConfig }) => {
        return mergeBuilderConfig(config, {
          output: {
            disableSvgr: true,
          },
        });
      });

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
