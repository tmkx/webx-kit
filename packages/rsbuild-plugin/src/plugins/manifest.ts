import path from 'node:path';
import { RsbuildPluginAPI, fse } from '@rsbuild/shared';
import { DEFAULT_MANIFEST_SRC, ManifestTransformer, createManifestGenerator } from '@webx-kit/core-plugin/manifest';

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

export const applyManifestSupport = (api: RsbuildPluginAPI, options: ManifestOptions) => {
  const { rootPath } = api.context;
  const sourcePath = path.join(rootPath, options.manifest || DEFAULT_MANIFEST_SRC);

  const { context, generate, watch, close } = createManifestGenerator({
    sourcePath,
    transformManifest: options.transformManifest,
  });

  api.onBeforeCreateCompiler(async () => {
    context.outputPath = path.join(api.context.distPath, 'manifest.json');
    await fse.ensureDir(api.context.distPath);
  });

  api.onAfterStartDevServer(async ({ port }) => {
    process.env.PORT = String(port);
    watch();
    await generate();
  });

  api.onAfterBuild(async () => void (await generate()));

  api.onExit(() => close());
};
