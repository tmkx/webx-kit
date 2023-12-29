import { BuilderPlugin } from '../types';

export const hmrCorsPlugin = (): BuilderPlugin => {
  return {
    name: '@webx-kit/modernjs-plugin/hmr-cors',
    async setup(api) {
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
    },
  };
};
