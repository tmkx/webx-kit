import path from 'node:path';
import { RsbuildPlugin } from '@rsbuild/shared';
import { ManifestTransformer, DEFAULT_MANIFEST_SRC, createManifestGenerator } from '@webx-kit/core-plugin/manifest';

export { type ManifestTransformer, registerManifestTransformer } from '@webx-kit/core-plugin/manifest';

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

export const manifestPlugin = (options: ManifestOptions): RsbuildPlugin => {
  return {
    name: '@webx-kit/modernjs-plugin/manifest',
    async setup(api) {
      const { rootPath, distPath } = api.context;
      const sourcePath = path.join(rootPath, options.manifest || DEFAULT_MANIFEST_SRC);
      const outputPath = path.join(distPath, 'manifest.json');

      const { context, generate, watch, close } = createManifestGenerator({
        sourcePath,
        outputPath,
        transformManifest: options.transformManifest,
      });

      api.onAfterStartDevServer(async ({ port }) => {
        context.port = port;
        process.env.PORT = String(port);
        watch();
        await generate();
      });

      api.onAfterBuild(async () => void (await generate()));

      api.onExit(() => close());
    },
  };
};
