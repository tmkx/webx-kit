import type { AppTools, UserConfig } from '@modern-js/app-tools';

export type BuilderPlugin = NonNullable<UserConfig<AppTools<'webpack' | 'rspack'>>['builderPlugins']>[number];
