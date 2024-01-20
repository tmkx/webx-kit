import { IncomingMessage, RequestListener, ServerResponse, createServer } from 'node:http';

export function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export interface CreateStaticServerOptions {
  handler?: RequestListener<typeof IncomingMessage, typeof ServerResponse>;
}

export async function createStaticServer({ handler }: CreateStaticServerOptions = {}) {
  const serverHandler = handler || ((_req, res) => res.end(`<html></html>`));
  const server = createServer(serverHandler);
  server.listen(0);
  return {
    server,
    close: () => server.close(),
    getURL: () => {
      const address = server.address();
      return typeof address === 'string' ? address : `http://127.0.0.1:${address?.port}/`;
    },
  };
}
