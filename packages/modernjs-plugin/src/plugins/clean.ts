import path from 'node:path';
import { RsbuildPlugin, fse } from '@rsbuild/shared';

export type CleanOptions = {
  /**
   * manifest source file path
   *
   * @default ['deploy.yml', 'modern.config.json', 'route.json']
   */
  clean?: string[] | false;
};

const DEFAULT_CLEAN_FILES = ['deploy.yml', 'modern.config.json', 'route.json'];

export const cleanPlugin = ({ clean = DEFAULT_CLEAN_FILES }: CleanOptions): RsbuildPlugin => {
  return {
    name: '@webx-kit/modernjs-plugin/clean',
    async setup(api) {
      if (clean === false) return;
      const { distPath } = api.context;
      api.onAfterBuild(async () => {
        for (const file of clean) {
          const filePath = path.resolve(distPath, file);
          if (fse.existsSync(filePath)) await fse.unlink(filePath);
        }
      });
    },
  };
};
