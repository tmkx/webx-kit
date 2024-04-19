# Messaging

## Recommend

We recommend communicating using [tRPC](https://trpc.io/), it's type-safe and supports streaming.

Add dependencies:

::: code-group

```bash [pnpm]
$ pnpm add @webx-kit/messaging @trpc/server@next @trpc/client@next zod
```

```bash [npm]
$ npm install @webx-kit/messaging @trpc/server@next @trpc/client@next zod
```

```bash [yarn]
$ yarn add @webx-kit/messaging @trpc/server@next @trpc/client@next zod
```

:::

Server(background):

::: code-group

```ts [background/index.ts]
import { createTrpcHandler } from '@webx-kit/messaging/background';
import { appRouter } from './router';

createTrpcHandler({
  router: appRouter,
});
```

```ts [background/router/index.ts]
import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.create({ isServer: true });

export const appRouter = t.router({
  hello: t.procedure.input(z.object({ name: z.string() })).query(async ({ input }) => {
    return `Hello, ${input.name}`;
  }),
});

export type AppRouter = typeof appRouter;
```

:::

Client(popup/options/content-scripts...):

::: code-group

```ts [popup/index.ts]
import { createTrpcClient } from '@webx-kit/messaging/popup';
import type { AppRouter } from '@/background/router';

const { client } = createTrpcClient<AppRouter>({});

// invoke
client.hello.query({ name: 'WebX Kit' }).then((value) => alert(value));
```

:::

## Other choices

We don't bundle sale specific libraries, you can choose your favorites.

- [webext-bridge](https://github.com/serversideup/webext-bridge) - 💬 Messaging in Web Extensions made easy. Batteries included.
- [Web Ext Core Messaging](https://webext-core.aklinker1.io/guide/messaging/) - A simpler, type-safe API for sending and recieving messages.
- [Add a new suggestion](https://github.com/tmkx/webx-kit/issues/new)
