import type { RequestHandler, RsbuildPluginAPI } from '@rsbuild/shared';

export function applyCorsSupport(api: RsbuildPluginAPI) {
  if (api.modifyRsbuildConfig) {
    api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) =>
      mergeRsbuildConfig(config, {
        dev: {
          setupMiddlewares: [
            (middlewares) => {
              middlewares.unshift(requestHandler);
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
            before: [requestHandler],
          },
        },
      })
    );
  }
}

const requestHandler: RequestHandler = (req, res, next) => {
  if (req.method?.toUpperCase() !== 'OPTIONS') return next();
  res.writeHead(200, {
    'Access-Control-Allow-Origin': req.headers.origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  });
  res.write('');
};
