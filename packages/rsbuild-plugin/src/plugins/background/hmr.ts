declare const RSBUILD_COMPILATION_NAME: string;
declare const RSBUILD_CLIENT_CONFIG: import('@rsbuild/core').ClientConfig;

const compilationId = RSBUILD_COMPILATION_NAME;
const config = RSBUILD_CLIENT_CONFIG;

const ws = new WebSocket(
  `${config.protocol}://${config.host}:${config.port}${config.path}?compilationId=${compilationId}`
);

const reloadMessages = new Set(['invalid', 'static-changed', 'content-changed']);

ws.addEventListener('message', (ev) => {
  const message = JSON.parse(ev.data);
  if (message.compilationId !== compilationId) return;
  if (reloadMessages.has(message.type)) chrome.runtime.reload();
});
