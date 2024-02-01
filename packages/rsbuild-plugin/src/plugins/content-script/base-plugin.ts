import type { JsChunk } from '../../utils/types';

export class ContentScriptBasePlugin {
  constructor(readonly contentScriptEntries: Set<string>) {}

  isEnabledForChunk = (chunk: JsChunk) => {
    return chunk.runtime.some((runtime) => this.contentScriptEntries.has(runtime));
  };
}
