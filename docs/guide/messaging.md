# Messaging

## Recommendation

We recommend using [tRPC](https://trpc.io/) for communication. It is type-safe and supports streaming.

1. Add dependencies:

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

2. Server(background):

> [Define Routers | tRPC](https://trpc.io/docs/server/routers)

::: code-group

```ts [background/index.ts]
import { createTrpcServer } from '@webx-kit/messaging/server';
import { appRouter } from './router';

createTrpcServer({
  router: appRouter,
});
```

```ts [background/router/index.ts]
import { t } from '@webx-kit/messaging/server';
import * as z from 'zod';

export const appRouter = t.router({
  hello: t.procedure.input(z.object({ name: z.string() })).query(async ({ ctx, input }) => {
    console.log(ctx.sender);
    return `Hello, ${input.name}`;
  }),
});

export type AppRouter = typeof appRouter;
```

:::

3. Client(popup/options/content-scripts...):

> [Set up a tRPC Client | tRPC](https://trpc.io/docs/client/vanilla/setup)

::: code-group

```ts [popup/index.ts]
import { createTrpcClient } from '@webx-kit/messaging/client';
import type { AppRouter } from '@/background/router';

const { client } = createTrpcClient<AppRouter>({});

// invoke
client.hello.query({ name: 'WebX Kit' }).then((value) => alert(value));
```

:::

## Other choices

We don't bundle sale specific libraries, you can choose your favorites.

- [webext-bridge](https://github.com/serversideup/webext-bridge) - Messaging in Web Extensions made easy. Batteries included.
- [Web Ext Core Messaging](https://webext-core.aklinker1.io/guide/messaging/) - A simpler, type-safe API for sending and recieving messages.
