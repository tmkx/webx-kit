import path from 'node:path';
import { FSWatcher, fs, isDev, watch } from '@modern-js/utils';
import { RsbuildPlugin } from '@rsbuild/shared';
import createJITI from '@rsbuild/shared/jiti';

export type ManifestOptions = {
  /**
   * manifest source file path
   *
   * @default `./src/manifest.ts`
   */
  manifest?: string;

  /**
   * The final phase of modifying manifest content
   */
  transformManifest?: ManifestTransformer;
};

export type Manifest = chrome.runtime.ManifestV3;

export type ManifestTransformerContext = {
  isDev: boolean;
  port: number;
};
export type ManifestTransformer = (manifest: Manifest, context: ManifestTransformerContext) => void | Promise<void>;

const DEFAULT_MANIFEST_SRC = './src/manifest.ts';

const manifestTransformers = new Set<ManifestTransformer>();

export function registerManifestTransformer(transformer: ManifestTransformer) {
  manifestTransformers.add(transformer);
}

export const manifestPlugin = (options: ManifestOptions): RsbuildPlugin => {
  return {
    name: '@webx-kit/modernjs-plugin/manifest',
    async setup(api) {
      const { rootPath, distPath } = api.context;
      const sourcePath = path.join(rootPath, options.manifest || DEFAULT_MANIFEST_SRC);
      const outputPath = path.join(distPath, 'manifest.json');

      const jiti = createJITI(__filename, { requireCache: false, interopDefault: true });
      const manifestContext: ManifestTransformerContext = {
        isDev: isDev(),
        port: 0,
      };

      async function generateManifest() {
        const manifest: Manifest = await jiti(sourcePath);
        for (const transform of manifestTransformers) {
          await transform(manifest, manifestContext);
        }
        await options.transformManifest?.(manifest, manifestContext);

        const content = isDev() ? JSON.stringify(manifest, null, 2) : JSON.stringify(manifest);
        await fs.writeFile(outputPath, content);
      }

      let watcher: FSWatcher | undefined;

      api.onAfterStartDevServer(({ port }) => {
        manifestContext.port = port;
        process.env.PORT = String(port);
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
