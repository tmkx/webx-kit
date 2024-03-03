import path from 'node:path';
import { RsbuildPluginAPI, isDev, fse } from '@rsbuild/shared';
import { FSWatcher, watch } from '@rsbuild/shared/chokidar';
import { evalFile } from '../utils';

export type ManifestOptions = {
  /**
   * manifest source file path
   *
   * @default `./src/manifest.ts`
   */
  manifest?: string;
};

const DEFAULT_MANIFEST_SRC = './src/manifest.ts';

export const applyManifestSupport = (api: RsbuildPluginAPI, options: ManifestOptions) => {
  const { rootPath } = api.context;
  const sourcePath = path.join(rootPath, options.manifest || DEFAULT_MANIFEST_SRC);

  async function generateManifest() {
    await fse.ensureDir(api.context.distPath);
    const outputPath = path.join(api.context.distPath, 'manifest.json');

    const {
      mod: { default: manifest },
    } = await evalFile<{ default: unknown }>(sourcePath);
    const content = isDev() ? JSON.stringify(manifest, null, 2) : JSON.stringify(manifest);
    await fse.writeFile(outputPath, content);
  }

  let watcher: FSWatcher | undefined;

  api.onAfterStartDevServer(({ port }) => {
    process.env.PORT = String(port);
    watcher = watch(sourcePath).on('change', (changedFilePath) => {
      if (changedFilePath !== sourcePath) return;
      generateManifest();
    });
    return generateManifest();
  });

  api.onAfterBuild(() => generateManifest());

  api.onExit(() => watcher?.close());
};
