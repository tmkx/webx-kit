# Environment Variables

WebX supports using different variables during development, build, and testing processes, which enhances the configurability of your project.

## Custom Environment Variables

::: warning
Only env vars prefixed with `WEBX_PUBLIC_` will be injected.
:::

::: code-group

```ini [.env]
WEBX_PUBLIC_SHIP_NAME="WebX - Alpha"
```

:::

### NODE_ENV Specific Env

> [Environment Variables - Rsbuild](https://rsbuild.dev/guide/advanced/env-vars#file-types)

| File Name                | Description                                                                |
| ------------------------ | -------------------------------------------------------------------------- |
| `.env`                   | Loaded by default in all scenarios.                                        |
| `.env.local`             | Local usage of the `.env` file, should be added to .gitignore.             |
| `.env.development`       | Read when `process.env.NODE_ENV` is `'development'`.                       |
| `.env.production`        | Read when `process.env.NODE_ENV` is `'production'`.                        |
| `.env.development.local` | Local usage of the `.env.development` file, should be added to .gitignore. |
| `.env.production.local`  | Local usage of the `.env.production` file, should be added to .gitignore.  |

If several of the above files exist at the same time, they will all be loaded, with the files listed at the bottom of the table having higher priority.

### Custom Specific Env

WebX also supports reading `.env.[mode]` and `.env.[mode].local` files. You can specify the env mode using the `--env-mode <mode>` CLI option.

For example, set the env mode as `test`:

::: code-group

```bash [Modern.js(Default)]
MODERN_ENV=test pnpm dev
```

```bash [Rsbuild]
pnpm dev --env-mode test
```

:::

## Using Environment Variables

### In Source Code

To reference an environment variable in your source code, use the full path `process.env.<ENV_NAME>`. Destructing the expression will prevent WebX from correctly recognizing it.

```ts
console.log(process.env.WEBX_PUBLIC_SHIP_NAME); // => "WebX - Alpha"

const { WEBX_PUBLIC_SHIP_NAME } = process.env;
console.log(WEBX_PUBLIC_SHIP_NAME); // => undefined

const vars = process.env;
console.log(vars.WEBX_PUBLIC_SHIP_NAME); // => undefined
```

#### Declare type of environment variable

::: code-group

```ts [@/env.d.ts]
declare module 'process' {
  global {
    namespace NodeJS {
      interface ProcessEnv {
        WEBX_PUBLIC_SHIP_NAME?: string;
      }
    }
  }
}
```

:::
