import { RsbuildPlugin } from '@rsbuild/shared';
import { BackgroundReloadPlugin } from './live-reload-plugin';
import { registerManifestTransformer } from '../manifest';

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

const DEFAULT_BACKGROUND_NAME = 'background';

export const getBackgroundEntryNames = ({ background }: BackgroundOptions): string[] => {
  if (!background) return [];
  if (typeof background === 'string') return [DEFAULT_BACKGROUND_NAME];
  return [background.name];
};

export const backgroundPlugin = ({ background, backgroundLiveReload = true }: BackgroundOptions): RsbuildPlugin => {
  return {
    name: '@webx-kit/modernjs-plugin/background',
    async setup(api) {
      if (!background) return;

      const entry: BackgroundEntry =
        typeof background === 'string' ? { name: DEFAULT_BACKGROUND_NAME, import: background } : background;

      const backgroundFilename = 'background.mjs';
      registerManifestTransformer(function background(manifest) {
        manifest.background = {
          service_worker: backgroundFilename,
          type: 'module',
        };
      });

      api.modifyWebpackChain((chain, { isDev }) => {
        chain.entry(entry.name).add({
          import: entry.import,
          library: { type: 'module' },
          filename: backgroundFilename,
        });
        if (isDev)
          chain.plugin('BackgroundReloadPlugin').use(BackgroundReloadPlugin, [entry.name, backgroundLiveReload]);
      });
    },
  };
};
