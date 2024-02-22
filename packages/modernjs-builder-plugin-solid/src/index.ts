import path from 'node:path';
import { RsbuildPlugin } from '@rsbuild/shared';
import { modifyBabelLoaderOptions } from '@rsbuild/plugin-babel';

export interface PluginSolidOptions {}

export const builderPluginSolid = ({}: PluginSolidOptions = {}): RsbuildPlugin => {
  return {
    name: '@webx-kit/modernjs-builder-plugin-solid',
    remove: ['builder-plugin-react', 'builder-plugin-antd', 'builder-plugin-arco'],
    setup(api) {
      api.modifyBundlerChain((chain, { CHAIN_ID, isProd }) => {
        const config = api.getNormalizedConfig();

        chain.module.rule(CHAIN_ID.RULE.SVG).oneOf(CHAIN_ID.ONE_OF.SVG).uses.delete(CHAIN_ID.USE.SVGR);
        chain.resolve.alias.set('solid-refresh', path.resolve(__dirname, '../node_modules/solid-refresh'));

        modifyBabelLoaderOptions({
          chain,
          CHAIN_ID,
          modifier: (babelOptions) => {
            babelOptions.presets ??= [];
            babelOptions.presets.push([require.resolve('babel-preset-solid')]);

            babelOptions.plugins?.find((plugin) => {
              if (!Array.isArray(plugin) || typeof plugin[0] !== 'string' || !plugin[0].includes('@babel/preset-react'))
                return false;
              plugin[1] = { ...plugin[1], runtime: 'automatic', importSource: 'solid-js' };
              return true;
            });

            if (!isProd && !!config.dev.hmr) {
              babelOptions.plugins ??= [];
              babelOptions.plugins.push([require.resolve('solid-refresh/babel'), { bundler: 'webpack5' }]);
            }

            return babelOptions;
          },
        });
      });
    },
  };
};
