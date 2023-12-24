import { appTools, defineConfig, webpack as webpackNS } from '@modern-js/app-tools';

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
  html: {
    disableHtmlFolder: true,
  },
  output: {
    disableInlineRuntimeChunk: true, // inline scripts are not allowed in MV3
    disableFilenameHash: true,
    distPath: {
      html: '.',
    },
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
  tools: {
    devServer: {
      client: {
        protocol: 'ws',
        host: 'localhost',
      },
    },
    webpackChain(chain, { webpack }) {
      // DO NOT split chunks when the entry is "content-script"
      chain.optimization.runtimeChunk(false).splitChunks({
        chunks: (chunk) => !['content-script', 'background'].includes(chunk.getEntryOptions()?.name!),
      });
      scriptEntries.forEach((entry) => chain.entry(entry.name).add(entry.path));
      chain.experiments({ outputModule: true });
      chain.entryPoints.set('background', {
        values: () =>
          ({
            import: './src/background/index.ts',
            library: { type: 'module' },
          } satisfies webpackNS.EntryObject[string]),
      } as any);

      chain.plugin('BackgroundReloadPlugin').use({
        apply(compiler) {
          const { RuntimeGlobals } = webpack;

          compiler.hooks.thisCompilation.tap('BackgroundReloadPlugin', (compilation) => {
            const isEnabledForChunk = (chunk: webpackNS.Chunk) => chunk.getEntryOptions()?.name === 'background';

            const {
              runtimeTemplate,
              outputOptions: { hotUpdateGlobal },
            } = compilation;

            class BackgroundReloadRuntimeModule extends webpack.RuntimeModule {
              generate() {
                if (!this.chunk) return null;
                return webpack.Template.asString([
                  `self.window = {
                    location: { reload: () => chrome.runtime.reload() },
                  }`,
                  `
                ${RuntimeGlobals.loadScript} = async function (url, done, key, chunkId) {
                  const code = await fetch(url).then((res) => res.text());
                  const [, hash] = /__webpack_require__\\.h = function\\(\\) { return "(\\w+)"; }/.exec(code) || [];
                  const hasUpdate = /^\\/\\*\\*\\*\\/ ".+":$/m.test(code);
                  if (hasUpdate) chrome.runtime.reload();
                  ${runtimeTemplate.globalObject}[${JSON.stringify(hotUpdateGlobal)}](${JSON.stringify(this.chunk.id)},
                    {}, (__webpack_require__) => { __webpack_require__.h = () => hash; }
                  );
                  done(null);
                };`,
                ]);
              }
            }

            const onceForChunkSet = new WeakSet<webpackNS.Chunk>();
            const handler = (chunk: webpackNS.Chunk, set: Set<string>) => {
              if (onceForChunkSet.has(chunk)) return;
              onceForChunkSet.add(chunk);
              if (!isEnabledForChunk(chunk)) return;
              set.add(RuntimeGlobals.moduleFactoriesAddOnly);
              set.add(RuntimeGlobals.hasOwnProperty);
              compilation.addRuntimeModule(
                chunk,
                new BackgroundReloadRuntimeModule('background reload runtime', webpack.RuntimeModule.STAGE_ATTACH)
              );
            };
            compilation.hooks.runtimeRequirementInTree
              .for(RuntimeGlobals.ensureChunkHandlers)
              .tap('BackgroundReloadPlugin', handler);
            compilation.hooks.runtimeRequirementInTree
              .for(RuntimeGlobals.hmrDownloadUpdateHandlers)
              .tap('BackgroundReloadPlugin', handler);
            compilation.hooks.runtimeRequirementInTree
              .for(RuntimeGlobals.hmrDownloadManifest)
              .tap('BackgroundReloadPlugin', handler);
            compilation.hooks.runtimeRequirementInTree
              .for(RuntimeGlobals.baseURI)
              .tap('BackgroundReloadPlugin', handler);

            compilation.hooks.runtimeRequirementInTree
              .for(RuntimeGlobals.ensureChunkHandlers)
              .tap('BackgroundReloadPlugin', (chunk, set) => {
                if (!isEnabledForChunk(chunk)) return;
                set.add(RuntimeGlobals.publicPath);
                set.add(RuntimeGlobals.getChunkScriptFilename);
              });
            compilation.hooks.runtimeRequirementInTree
              .for(RuntimeGlobals.hmrDownloadUpdateHandlers)
              .tap('BackgroundReloadPlugin', (chunk, set) => {
                if (!isEnabledForChunk(chunk)) return;
                set.add(RuntimeGlobals.publicPath);
                set.add(RuntimeGlobals.getChunkUpdateScriptFilename);
                set.add(RuntimeGlobals.moduleCache);
                set.add(RuntimeGlobals.hmrModuleData);
                set.add(RuntimeGlobals.moduleFactoriesAddOnly);
              });
            compilation.hooks.runtimeRequirementInTree
              .for(RuntimeGlobals.hmrDownloadManifest)
              .tap('BackgroundReloadPlugin', (chunk, set) => {
                if (!isEnabledForChunk(chunk)) return;
                set.add(RuntimeGlobals.publicPath);
                set.add(RuntimeGlobals.getUpdateManifestFilename);
              });
          });
        },
      });
    },
  },
});

async function evalFile<T>(filepath: string) {
  const { bundleRequire } = await import('bundle-require');
  return await bundleRequire<T>({ filepath });
}
