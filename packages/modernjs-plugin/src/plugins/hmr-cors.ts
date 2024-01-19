import { RsbuildPlugin } from '@rsbuild/shared';

export const hmrCorsPlugin = (): RsbuildPlugin => {
  return {
    name: '@webx-kit/modernjs-plugin/hmr-cors',
    async setup(api) {
      if (api.modifyRsbuildConfig) {
        api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) =>
          mergeRsbuildConfig(config, {
            dev: {
              setupMiddlewares: [
                (middlewares) => {
                  middlewares.unshift((req, res, next) => {
                    if (req.method?.toUpperCase() !== 'OPTIONS') return next();
                    res.writeHead(200, {
                      'Access-Control-Allow-Origin': '*',
                      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                    });
                    res.write('OK');
                  });
                },
              ],
            },
          })
        );
      } else {
        // @ts-ignore compat for modern.js < 2.46.0
        api.modifyBuilderConfig((config, { mergeBuilderConfig }) =>
          mergeBuilderConfig(config, {
            tools: {
              devServer: {
                before: [
                  (req, res, next) => {
                    if (req.method?.toUpperCase() !== 'OPTIONS') return next();
                    res.writeHead(200, {
                      'Access-Control-Allow-Origin': '*',
                      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                    });
                    res.write('OK');
                  },
                ],
              },
            },
          })
        );
      }
    },
  };
};
