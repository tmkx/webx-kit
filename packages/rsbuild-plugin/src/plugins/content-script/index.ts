import type { BundlerPluginInstance, RsbuildPluginAPI } from '@rsbuild/core';
import { isDev, isProd } from '../env';
import { registerManifestTransformer } from '../manifest';
import { castArray } from '../../utils/misc';
import type { Override } from '../../utils/types';
import { ContentScriptHMRPlugin } from './hmr-plugin';
import { ContentScriptPublicPathPlugin } from './public-path-plugin';
import { ContentScriptShadowRootPlugin } from './shadow-root-plugin';

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

function getContentScriptEntryNames(options: NormalizeContentScriptsOptions): string[] {
  return castArray(options.contentScripts || []).map(({ name }) => name);
}

export function applyContentScriptsSupport(api: RsbuildPluginAPI, options: NormalizeContentScriptsOptions): boolean {
  const { contentScripts, autoRefreshContentScripts } = options;
  if (contentScripts.length === 0) return false;

  const contentScriptNames = new Set(getContentScriptEntryNames(options));

  registerManifestTransformer('content-script', manifest => {
    if (!manifest.content_scripts && (!autoRefreshContentScripts || isProd())) {
      manifest.content_scripts = contentScripts.map(({ name, import: _import, ...entry }) => ({
        js: [`static/js/${name}.js`],
        ...entry,
      }));
    }
  });

  api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
    return mergeRsbuildConfig(config, {
      environments: {
        'content-script': {
          source: {
            entry: Object.fromEntries(contentScripts.map(cs => [cs.name, cs.import])),
          },
          performance: {
            chunkSplit: {
              strategy: 'all-in-one',
            },
          },
          output: {
            filenameHash: false,
          },
          tools: {
            htmlPlugin: false,
            rspack(_config, { appendPlugins }) {
              const plugins: BundlerPluginInstance[] = isDev()
                ? [
                    new ContentScriptHMRPlugin(contentScriptNames),
                    new ContentScriptShadowRootPlugin(contentScriptNames),
                  ]
                : [new ContentScriptPublicPathPlugin(contentScriptNames)];
              appendPlugins(plugins);
            },
          },
        },
      },
    });
  });

  return true;
}
