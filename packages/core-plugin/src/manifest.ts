import path from 'node:path';
import { RsbuildPluginAPI, fse, isDev } from '@rsbuild/shared';
import { FSWatcher, watch } from '@rsbuild/shared/chokidar';
import createJITI from '@rsbuild/shared/jiti';

const DEFAULT_MANIFEST_SRC = './src/manifest.ts';

export type Manifest = chrome.runtime.ManifestV3;

export type ManifestTransformerContext = {
  isDev: boolean;
  outputPath?: string;
  port: number;
};

export type ManifestTransformer = (manifest: Manifest, context: ManifestTransformerContext) => void | Promise<void>;

const manifestTransformers = new Map<string, ManifestTransformer>();

export function registerManifestTransformer(name: string, transformer: ManifestTransformer) {
  manifestTransformers.set(name, transformer);
}

interface CreateManifestGeneratorParams {
  sourcePath: string;
  outputPath?: string;
  /**
   * The final phase of modifying manifest content
   */
  transformManifest?: ManifestTransformer;
}

function createManifestGenerator({ sourcePath, outputPath, transformManifest }: CreateManifestGeneratorParams) {
  let watcher: FSWatcher | undefined;
  const context: ManifestTransformerContext = {
    isDev: isDev(),
    outputPath,
    port: 0,
  };
  const jiti = createJITI(__filename, { requireCache: false, interopDefault: true });

  async function generate() {
    const userManifest: UserManifest = await jiti(sourcePath);
    const manifest = typeof userManifest === 'function' ? await userManifest(context) : userManifest;

    applyCSPPlugin(manifest, context);
    for (const transform of manifestTransformers.values()) {
      await transform(manifest, context);
    }
    await transformManifest?.(manifest, context);

    context.outputPath && (await fse.writeJson(context.outputPath, manifest, { spaces: context.isDev ? 2 : 0 }));
    return manifest;
  }

  return {
    context,
    watch(): FSWatcher {
      if (watcher) return watcher;
      watcher = watch(sourcePath).on('change', (changedFilePath) => {
        if (changedFilePath !== sourcePath) return;
        generate();
      });
      return watcher;
    },
    close() {
      watcher?.close();
      watcher = undefined;
    },
    generate,
  };
}

export type UserManifest = Manifest | ((context: ManifestTransformerContext) => Manifest | Promise<Manifest>);

export function defineManifest(options: UserManifest): UserManifest {
  return options;
}

function applyCSPPlugin(manifest: Manifest, context: ManifestTransformerContext) {
  if (!context.isDev || manifest.content_security_policy?.extension_pages) return;
  manifest.content_security_policy ??= {};
  manifest.content_security_policy.extension_pages = `script-src 'self' http://localhost:${context.port}/; object-src 'self' http://localhost:${context.port}/`;
}

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

  const { context, generate, watch, close } = createManifestGenerator({
    sourcePath: path.join(rootPath, options.manifest || DEFAULT_MANIFEST_SRC),
    transformManifest: options.transformManifest,
  });

  api.onBeforeCreateCompiler(async () => {
    context.outputPath = path.join(api.context.distPath, 'manifest.json');
    await fse.ensureDir(api.context.distPath);
  });

  api.onAfterStartDevServer(async ({ port }) => {
    context.port = port;
    watch();
    await generate();
  });

  api.onAfterBuild(async () => void (await generate()));

  api.onExit(() => close());
};
