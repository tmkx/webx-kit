import path from 'node:path';
import type { AppTools, UserConfig } from '@modern-js/app-tools';
import { isDev } from '@modern-js/utils';

type BuilderPlugin = NonNullable<UserConfig<AppTools>['builderPlugins']>[number];

export interface PluginSolidOptions {}

export const builderPluginSolid = ({}: PluginSolidOptions = {}): BuilderPlugin => {
  return {
    name: '@webx-kit/modernjs-builder-plugin-solid',
    remove: ['builder-plugin-react', 'builder-plugin-antd', 'builder-plugin-arco'],
    setup(api) {
      api.modifyBuilderConfig((config, { mergeBuilderConfig }) => {
        return mergeBuilderConfig(config, {
          source: {
            alias: {
              'solid-refresh': path.resolve(__dirname, '../node_modules/solid-refresh'),
            },
          },
          output: {
            disableSvgr: true,
          },
          tools: {
            babel(_config, { addPresets, addPlugins }) {
              addPresets(['babel-preset-solid']);
              if (isDev()) {
                addPlugins([['solid-refresh/babel', { bundler: 'webpack5' }]]);
              }
            },
          },
        });
      });
    },
  };
};
