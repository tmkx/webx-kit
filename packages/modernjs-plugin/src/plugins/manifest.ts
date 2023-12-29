import path from 'node:path';
import { FSWatcher, fs, isDev, watch } from '@modern-js/utils';
import { evalFile } from '../utils';
import { BuilderPlugin } from '../types';

export type ManifestOptions = {
  /**
   * manifest source file path
   *
   * @default `./src/manifest.ts`
   */
  manifest?: string;
};

const DEFAULT_MANIFEST_SRC = './src/manifest.ts';

export const manifestPlugin = (options: ManifestOptions): BuilderPlugin => {
  return {
    name: '@webx-kit/modernjs-plugin/manifest',
    async setup(api) {
      const { rootPath, distPath } = api.context;
      const sourcePath = path.join(rootPath, options.manifest || DEFAULT_MANIFEST_SRC);
      const outputPath = path.join(distPath, 'manifest.json');

      async function generateManifest() {
        const {
          mod: { default: manifest },
        } = await evalFile<{ default: unknown }>(sourcePath);
        const content = isDev() ? JSON.stringify(manifest, null, 2) : JSON.stringify(manifest);
        await fs.writeFile(outputPath, content);
      }

      let watcher: FSWatcher | undefined;

      api.onAfterStartDevServer(() => {
        watcher = watch(sourcePath, ({ changedFilePath, changeType }) => {
          if (changedFilePath !== sourcePath) return;
          if (changeType !== 'change' && changeType !== 'add') return;
          return generateManifest();
        });
        return generateManifest();
      });

      api.onAfterBuild(() => generateManifest());

      api.onExit(() => watcher?.close());
    },
  };
};
