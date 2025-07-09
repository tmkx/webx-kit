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
  const method = req.method?.toUpperCase();
  const origin = req.headers.origin;

  res.setHeaders(
    new Headers({
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    })
  );

  if (method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  next();
};
