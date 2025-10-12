declare const RSBUILD_WEB_SOCKET_TOKEN: string;
declare const RSBUILD_CLIENT_CONFIG: import('@rsbuild/core').ClientConfig;

const hmrToken = RSBUILD_WEB_SOCKET_TOKEN;
const config = RSBUILD_CLIENT_CONFIG;

const ws = new WebSocket(`${config.protocol}://${config.host}:${config.port}${config.path}?token=${hmrToken}`);

ws.addEventListener('message', ev => {
  const message = JSON.parse(ev.data);
  if (message.type !== 'hash') return;
  if (message.data !== __webpack_hash__) chrome.runtime.reload();
});
