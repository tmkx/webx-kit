import type { RequestHandler, RsbuildPluginAPI } from '@rsbuild/core';

export function applyCorsSupport(api: RsbuildPluginAPI) {
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
}

const requestHandler: RequestHandler = (req, res, next) => {
  if (req.method?.toUpperCase() !== 'OPTIONS') return next();
  res.writeHead(200, {
    'Access-Control-Allow-Origin': req.headers.origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  });
  res.write('');
};
