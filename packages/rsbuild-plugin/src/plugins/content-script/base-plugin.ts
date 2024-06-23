import type { Rspack } from '@rsbuild/shared';

export class ContentScriptBasePlugin {
  constructor(readonly contentScriptEntries: Set<string>) {}

  isEnabledForChunk = (chunk: Rspack.Chunk) => {
    return chunk.runtime.some((runtime) => this.contentScriptEntries.has(runtime));
  };
}
