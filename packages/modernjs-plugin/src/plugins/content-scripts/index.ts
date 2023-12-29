import { WebpackChain, isDev } from '@modern-js/utils';
import { BuilderPlugin } from '../../types';
import { ContentScriptHMRPlugin } from './hmr-plugin';
import { ContentScriptShadowRootPlugin } from './shadow-root-plugin';
import { DEFAULT_CONTENT_SCRIPT_NAME } from './constants.mjs';

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

export const getContentScriptEntryNames = ({ contentScripts }: ContentScriptsOptions): string[] => {
  if (!contentScripts) return [];
  if (typeof contentScripts === 'string') return [DEFAULT_CONTENT_SCRIPT_NAME];
  return contentScripts.map(({ name }) => name);
};

export const contentScriptsPlugin = ({ contentScripts }: ContentScriptsOptions): BuilderPlugin => {
  return {
    name: '@webx-kit/modernjs-plugin/content-scripts',
    async setup(api) {
      if (!contentScripts || contentScripts.length === 0) return;

      const entries: ContentScriptEntry[] = Array.isArray(contentScripts)
        ? contentScripts
        : [{ name: DEFAULT_CONTENT_SCRIPT_NAME, import: contentScripts }];

      api.modifyWebpackChain((chain: WebpackChain) => {
        entries.forEach((entry) => chain.entry(entry.name).add(entry.import));

        if (isDev()) {
          const contentScriptNames = new Set(getContentScriptEntryNames({ contentScripts }));
          chain.plugin('ContentScriptHMRPlugin').use(ContentScriptHMRPlugin, [contentScriptNames]);
          chain.plugin('ContentScriptShadowRootPlugin').use(ContentScriptShadowRootPlugin, [contentScriptNames]);
        }
      });
    },
  };
};
