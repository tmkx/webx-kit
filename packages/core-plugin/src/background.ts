import type { BundlerChain, RsbuildPluginAPI, Rspack, WebpackChain, WebpackConfig } from '@rsbuild/shared';
import { registerManifestTransformer } from './manifest';

const DEFAULT_BACKGROUND_NAME = 'background';

export type BackgroundEntry = {
  name: string;
  import: string;
};

export type BackgroundOptions = {
  /**
   * background service-worker entry
   */
  background?: string | BackgroundEntry;
  /**
   * auto reload when the background changed
   *
   * @default true
   */
  backgroundLiveReload?: boolean;
};

export function getBackgroundEntryNames({ background }: BackgroundOptions): string[] {
  if (!background) return [];
  if (typeof background === 'string') return [DEFAULT_BACKGROUND_NAME];
  return [background.name];
}

export function applyBackgroundSupport(
  api: RsbuildPluginAPI,
  options: BackgroundOptions,
  getPlugins: (context: {
    entryName: string;
    backgroundLiveReload: boolean;
  }) => Rspack.Plugins | WebpackConfig['plugins'] | void
) {
  const { background, backgroundLiveReload = true } = options;
  if (!background) return;

  const entry: BackgroundEntry =
    typeof background === 'string' ? { name: DEFAULT_BACKGROUND_NAME, import: background } : background;

  const backgroundFilename = 'background.mjs';
  registerManifestTransformer('background', (manifest) => {
    manifest.background = {
      service_worker: backgroundFilename,
      type: 'module',
    };
  });

  function modifyChain(chain: WebpackChain | BundlerChain) {
    chain.entry(entry.name).add({
      import: entry.import,
      library: { type: 'module' },
      filename: backgroundFilename,
    });
    const plugins = getPlugins({ entryName: entry.name, backgroundLiveReload });
    if (plugins) plugins.forEach((plugin) => plugin && chain.plugin(plugin.name).use(plugin as any));
  }

  if (api.context.bundlerType === 'webpack') api.modifyWebpackChain(modifyChain);
  else api.modifyBundlerChain(modifyChain);
}

export function generateLoadScriptCode(options: {
  RuntimeGlobals: Rspack.Compiler['webpack']['RuntimeGlobals'];
  outputOptions: Pick<Rspack.OutputNormalized, 'globalObject' | 'hotUpdateGlobal'>;
  chunkId?: string | number | null;
  autoReload?: boolean;
}): string[] {
  return [
    // shim window.location.reload() behavior
    options.autoReload
      ? `self.window = { location: { reload: () => chrome.runtime.reload() } }`
      : `self.window = { location: { reload: () => { /* noop */ } } }`,

    // jsonp is not working in the ServiceWorker environment, and dynamic scripts are NOT supported
    `${options.RuntimeGlobals.loadScript} = async function (url, done) {
    const code = await fetch(url).then((res) => res.text());`,
    // __webpack_require__.h = function() { return "xxxxxxxx"; }
    // __webpack_require__.h = function() {
    //  return "xxxxxxxx";
    // }
    // __webpack_require__.h = () => ("xxxxxxxx")
    `const [, hash] = /__webpack_require__\\.h =[\\s\\S]+?"(\\w+)"/.exec(code) || [];`,

    options.autoReload
      ? // /**** "moduleId":
        // "moduleId":
        `const hasUpdate = /^[\/*\\s]*".+":/m.test(code);
         if (hasUpdate) { chrome.runtime.reload(); }`
      : ``,

    // update the full hash, tell HMR client that we are done
    `${options.outputOptions.globalObject}[${JSON.stringify(options.outputOptions.hotUpdateGlobal)}](${JSON.stringify(
      options.chunkId
    )}, {}, (__webpack_require__) => { __webpack_require__.h = () => hash; });
      done(null);
    };`,
  ];
}
