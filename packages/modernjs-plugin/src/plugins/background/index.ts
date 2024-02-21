import { RsbuildPlugin } from '@rsbuild/shared';
import { BackgroundReloadPlugin } from './live-reload-plugin';

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

      api.modifyWebpackChain((chain, { isProd }) => {
        chain.entry(entry.name).add({
          import: entry.import,
          library: { type: 'module' },
        });
        if (!isProd)
          chain.plugin('BackgroundReloadPlugin').use(BackgroundReloadPlugin, [entry.name, backgroundLiveReload]);
      });
    },
  };
};
