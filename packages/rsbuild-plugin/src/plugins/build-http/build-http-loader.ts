import type { LoaderDefinition } from '@rspack/core';

const loader: LoaderDefinition = function (_code, _sourceMap, _additionalData) {
  const query = new URLSearchParams(this.resourceQuery);
  const request = new URL(query.get('request')!);
  const callback = this.async();
  fetch(request)
    .then((res) => res.text())
    .then((content) => callback(null, content))
    .catch((err) => callback(err));
};

// @ts-expect-error CJS export
export = loader;
