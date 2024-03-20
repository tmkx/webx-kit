import { BundlerChain, RsbuildPluginAPI, Rspack, WebpackChain, WebpackConfig, isProd } from '@rsbuild/shared';
import type { SetRequired } from 'type-fest';
import { registerManifestTransformer } from './manifest';
import { Override, castArray } from './utils';

type ContentScriptItem = NonNullable<chrome.runtime.ManifestV3['content_scripts']>[number];

export interface ContentScriptEntry extends ContentScriptItem {
  import: string;
  name?: string;
  run_at?: chrome.scripting.RegisteredContentScript['runAt'];
}

type StrictContentScriptEntry = SetRequired<ContentScriptEntry, 'name'>;

export type ContentScriptsOptions = {
  /**
   * content-script entries
   */
  contentScripts?: ContentScriptEntry | ContentScriptEntry[];

  /**
   * Auto refresh content scripts
   *
   * @experimental
   * @default false
   */
  autoRefreshContentScripts?: boolean;
};

export type NormalizeContentScriptsOptions<T extends ContentScriptsOptions = ContentScriptsOptions> = Override<
  T,
  {
    contentScripts: StrictContentScriptEntry[];
    autoRefreshContentScripts: boolean;
  }
>;

export function normalizeContentScriptsOptions<T extends ContentScriptsOptions>({
  autoRefreshContentScripts,
  contentScripts,
  ...options
}: T): NormalizeContentScriptsOptions<T> {
  const getDefaultName = (index: number) => `content-script${index ? `-${index}` : ''}`;
  return {
    ...options,
    autoRefreshContentScripts: autoRefreshContentScripts ?? false,
    contentScripts: castArray(contentScripts || []).map<StrictContentScriptEntry>((cs, index) => ({
      name: getDefaultName(index),
      ...cs,
    })),
  };
}

export function getContentScriptEntryNames(options: NormalizeContentScriptsOptions): string[] {
  return castArray(options.contentScripts || []).map(({ name }) => name);
}

export function applyContentScriptsSupport(
  api: RsbuildPluginAPI,
  options: NormalizeContentScriptsOptions,
  getPlugins: (context: { contentScriptNames: Set<string> }) => Rspack.Plugins | WebpackConfig['plugins'] | void
) {
  const { contentScripts, autoRefreshContentScripts } = options;
  if (contentScripts.length === 0) return;

  const contentScriptNames = new Set(getContentScriptEntryNames(options));

  registerManifestTransformer('content-script', (manifest) => {
    if (!manifest.content_scripts && contentScripts.length && (!autoRefreshContentScripts || isProd())) {
      manifest.content_scripts = contentScripts.map(({ name, import: _import, ...entry }) => ({
        js: [`static/js/${name}.js`],
        ...entry,
      }));
    }
  });

  function modifyChain(chain: WebpackChain | BundlerChain) {
    contentScripts.forEach((cs) => chain.entry(cs.name).add(cs.import));
    const plugins = getPlugins({ contentScriptNames });
    if (plugins) plugins.forEach((plugin) => plugin && chain.plugin(plugin.name).use(plugin as any));
  }

  if (api.context.bundlerType === 'webpack') api.modifyWebpackChain(modifyChain);
  else api.modifyBundlerChain(modifyChain);

  return { contentScriptNames };
}

export function generateLoadScriptCode(options: {
  RuntimeGlobals: Rspack.Compiler['webpack']['RuntimeGlobals'];
}): string[] {
  return [
    // jsonp will cause cross-context issues in the isolated content-script environment
    `${options.RuntimeGlobals.loadScript} = async function (url, done) {
      await import(url);
      done(null);
    };`,
  ];
}
