import type { webpack as webpackNS } from '@modern-js/app-tools';

export class ContentScriptBasePlugin {
  constructor(readonly contentScriptEntries: Set<string>) {}

  isEnabledForChunk = (chunk: webpackNS.Chunk) => {
    const entryName = chunk.getEntryOptions()?.name;
    if (!entryName) return false;
    return this.contentScriptEntries.has(entryName);
  };
}
