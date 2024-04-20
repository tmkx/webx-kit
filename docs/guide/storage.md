# Storage

## Recommendation

`@webx-kit/storage` is a wrapper of the [`chrome.storage`](https://developer.chrome.com/docs/extensions/reference/api/storage) API, serving as a compatible layer for [jotai](https://jotai.org/docs/utilities/storage)/[unstorage](https://unstorage.unjs.io/) to inherit the power of the ecosystem.

Add dependencies:

::: code-group

```bash [pnpm]
$ pnpm add @webx-kit/storage
```

```bash [npm]
$ npm install @webx-kit/storage
```

```bash [yarn]
$ yarn add @webx-kit/storage
```

:::

### [jotai](https://jotai.org/docs/utilities/storage)

::: code-group

```ts [atom.ts]
import { atomWithStorage } from 'jotai/utils';
import { createStorage } from '@webx-kit/storage';

const configStorage = createStorage({ prefix: 'config:' });

export const apiKeyAtom = atomWithStorage('apiKey', 'DEFAULT', configStorage);
```

```tsx [index.tsx]
import { apiKeyAtom } from './atoms';

const App = () => {
  const [apiKey, setAPIKey] = useAtom(apiKeyAtom);
  return (
    <div>
      <div>{apiKey}</div>
      <button onClick={() => setAPIKey('Changed')} />
    </div>
  );
};
```

:::

### [unstorage](https://unstorage.unjs.io/)

```ts
import { createStorage } from 'unstorage';
import { createDriver } from '@webx-kit/storage/unstorage';

export const storage = createStorage({
  driver: createDriver({ prefix: 'unstorage:' }),
});

await storage.setItem(key, value);
```

## Other choices

- [Web Ext Core Storage](https://webext-core.aklinker1.io/guide/storage/) provides a type-safe, localStorage-like API for interacting with extension storage.
- [@plasmohq/storage](https://docs.plasmo.com/framework/storage) is a utility library from Plasmo that abstracts the persistent storage API available to browser extensions.
