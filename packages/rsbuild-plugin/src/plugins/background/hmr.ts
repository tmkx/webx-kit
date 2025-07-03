declare const RSBUILD_HMR_TOKEN: string;
declare const RSBUILD_CLIENT_CONFIG: import('@rsbuild/core').ClientConfig;

const hmrToken = RSBUILD_HMR_TOKEN;
const config = RSBUILD_CLIENT_CONFIG;

const ws = new WebSocket(`${config.protocol}://${config.host}:${config.port}${config.path}?token=${hmrToken}`);

const reloadMessages = new Set(['invalid', 'static-changed', 'content-changed']);

ws.addEventListener('message', (ev) => {
  const message = JSON.parse(ev.data);
  if (reloadMessages.has(message.type)) chrome.runtime.reload();
});
