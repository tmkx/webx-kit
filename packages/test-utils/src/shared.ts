import {
  type IncomingMessage,
  type RequestListener,
  type ServerResponse,
  createServer as createHttpServer,
} from 'node:http';
import { createServer as createNetServer } from 'node:net';

export function sleep(ms = 0) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function getRandomPort() {
  const server = createNetServer();
  server.listen(0);
  return new Promise<number>((resolve, reject) => {
    server.addListener('listening', () => {
      const address = server.address();
      if (!address || typeof address === 'string') reject('Invalid address');
      else resolve(address.port);
      server.close();
    });
    server.addListener('close', () => reject('Close'));
  });
}

export interface CreateStaticServerOptions {
  handler?: RequestListener<typeof IncomingMessage, typeof ServerResponse>;
}

export async function createStaticServer({ handler }: CreateStaticServerOptions = {}) {
  const serverHandler = handler || ((_req, res) => res.end(`<html></html>`));
  const server = createHttpServer(serverHandler);
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
