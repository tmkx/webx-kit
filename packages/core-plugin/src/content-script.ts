import type { BundlerChain, RsbuildPluginAPI, Rspack, WebpackChain, WebpackConfig } from '@rsbuild/shared';

const DEFAULT_CONTENT_SCRIPT_NAME = 'content-script';

export type ContentScriptEntry = {
  name: string;
  import: string;
};

export type ContentScriptsOptions = {
  /**
   * content-script entries
   */
  contentScripts?: string | ContentScriptEntry[];
};

export function getContentScriptEntryNames({ contentScripts }: ContentScriptsOptions): string[] {
  if (!contentScripts) return [];
  if (typeof contentScripts === 'string') return [DEFAULT_CONTENT_SCRIPT_NAME];
  return contentScripts.map(({ name }) => name);
}

export function applyContentScriptsSupport(
  api: RsbuildPluginAPI,
  { contentScripts }: ContentScriptsOptions,
  getPlugins: (context: { contentScriptNames: Set<string> }) => Rspack.Plugins | WebpackConfig['plugins'] | void
) {
  if (!contentScripts || contentScripts.length === 0) return;

  const entries: ContentScriptEntry[] = Array.isArray(contentScripts)
    ? contentScripts
    : [{ name: DEFAULT_CONTENT_SCRIPT_NAME, import: contentScripts }];

  const contentScriptNames = new Set(getContentScriptEntryNames({ contentScripts }));

  function modifyChain(chain: WebpackChain | BundlerChain) {
    entries.forEach((entry) => chain.entry(entry.name).add(entry.import));
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
