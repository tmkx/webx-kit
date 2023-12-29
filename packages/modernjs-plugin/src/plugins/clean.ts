import path from 'node:path';
import { fs } from '@modern-js/utils';
import { BuilderPlugin } from '../types';

export type CleanOptions = {
  /**
   * manifest source file path
   *
   * @default ['modern.config.json', 'route.json']
   */
  clean?: string[] | false;
};

const DEFAULT_CLEAN_FILES = ['modern.config.json', 'route.json'];

export const cleanPlugin = ({ clean = DEFAULT_CLEAN_FILES }: CleanOptions): BuilderPlugin => {
  return {
    name: '@webx-kit/modernjs-plugin/clean',
    async setup(api) {
      if (clean === false) return;
      const { distPath } = api.context;
      api.onAfterBuild(async () => {
        for (const file of DEFAULT_CLEAN_FILES) {
          const filePath = path.resolve(distPath, file);
          if (fs.existsSync(filePath)) await fs.unlink(filePath);
        }
      });
    },
  };
};
