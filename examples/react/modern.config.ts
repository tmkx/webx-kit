import { appTools, defineConfig } from '@modern-js/app-tools';

const isDev = process.env.NODE_ENV === 'development';

const scriptEntries = [
  {
    name: 'content-script',
    path: './src/content-scripts/index.tsx',
  },
];

// https://modernjs.dev/en/configure/app/usage
export default defineConfig({
  plugins: [appTools()],
  source: {
    entriesDir: './src/pages',
  },
  dev: {
    assetPrefix: true,
  },
  output: {
    disableInlineRuntimeChunk: true, // inline scripts are not allowed in MV3
    disableFilenameHash: true,
    copy: [
      {
        from: './src/manifest.ts',
        to: './manifest.json',
        async transform(_input, filename) {
          const {
            mod: { default: manifest },
          } = await evalFile<typeof import('./src/manifest')>(filename);
          return isDev ? JSON.stringify(manifest, null, 2) : JSON.stringify(manifest);
        },
      },
    ],
    polyfill: 'off',
  },
  performance: {
    chunkSplit: {
      strategy: 'all-in-one',
    },
  },
  tools: {
    devServer: {
      client: {
        protocol: 'ws',
        host: 'localhost',
      },
    },
    webpackChain(chain) {
      scriptEntries.forEach((entry) => chain.entry(entry.name).add(entry.path));
    },
  },
});

async function evalFile<T>(filepath: string) {
  const { bundleRequire } = await import('bundle-require');
  return await bundleRequire<T>({ filepath });
}
