import type { Rspack } from '@rsbuild/core';
import { ENV_PREFIX, publicVars } from '../env';

const loader: Rspack.LoaderDefinition = function (_code, _sourceMap, _additionalData) {
  const query = new URLSearchParams(this.resourceQuery);
  const url = new URL(query.get('request')!);
  const callback = this.async();
  fetch(evalURL(url), {
    headers: {
      'User-Agent': 'WebX Kit',
    },
  })
    .then(async (res) => {
      const contentType = res.headers.get('content-type');
      if (contentType && /^application\/json\b/.test(contentType)) {
        return `module.exports = ${JSON.stringify(await res.json())}`;
      }
      return await res.text();
    })
    .then((content) => callback(null, content))
    .catch((err) => callback(err));
};

function evalURL(url: URL | string) {
  const urlObj = new URL(url);
  for (const [key, value] of urlObj.searchParams.entries()) {
    if (!value.startsWith(`$${ENV_PREFIX}`)) continue;
    const fullEnv = `process.env.${value.slice(1)}`;
    if (!(fullEnv in publicVars)) continue;
    urlObj.searchParams.set(key, publicVars[fullEnv].slice(1, -1));
  }
  return urlObj;
}

// @ts-expect-error CJS export
export = loader;
