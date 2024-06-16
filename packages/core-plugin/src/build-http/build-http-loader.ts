import type { Rspack } from '@rsbuild/shared';
import { publicVars } from '../env';

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
        return `export default JSON.parse(${JSON.stringify(JSON.stringify(await res.json()))})`;
      }
      return await res.text();
    })
    .then((content) => callback(null, content))
    .catch((err) => callback(err));
};

function evalURL(url: URL | string) {
  return url.toString().replace(/\$(\w+)/g, (match, env) => {
    const fullEnv = `process.env.${env}`;
    return fullEnv in publicVars ? publicVars[fullEnv].slice(1, -1) : match;
  });
}

// @ts-expect-error CJS export
export = loader;
