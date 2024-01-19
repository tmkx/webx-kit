import type { webpack as webpackNS } from '@modern-js/app-tools';
import { isDev, type WebpackChain } from '@modern-js/utils';
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

      api.modifyWebpackChain((chain: WebpackChain) => {
        chain.entryPoints.set(entry.name, {
          values: () =>
            ({
              import: entry.import,
              library: { type: 'module' },
            } satisfies webpackNS.EntryObject[string]),
        } as any);

        if (isDev())
          chain.plugin('BackgroundReloadPlugin').use(BackgroundReloadPlugin, [entry.name, backgroundLiveReload]);
      });
    },
  };
};
