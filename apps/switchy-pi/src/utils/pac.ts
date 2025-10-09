import type { FixedProfile, ProxyServer } from '@/schemas';

export function generatePACFromFixedProfile(server: FixedProfile) {
  return `
var FindProxyForURL = (function (init, profiles) {
  return function (url, host) {
    'use strict';
    var result = init,
      scheme = url.substr(0, url.indexOf(':'));
    do {
      result = profiles[result];
      if (typeof result === 'function') result = result(url, host, scheme);
    } while (typeof result !== 'string' || result.charCodeAt(0) === 43);
    return result;
  };
})(${JSON.stringify(server.name)}, {
  ${JSON.stringify(server.name)}: ${generateFunction(server)},
  });
  `;
}

function generateFunction(server: FixedProfile) {
  return `function (url, host, scheme) {
    'use strict';
    ${
      server.bypassList.length > 0
        ? `if (${server.bypassList
            .map((item) => `/^${item.pattern.replace(/\./g, '\\.')}$/.test(host)`)
            .join(' || ')}) return 'DIRECT';`
        : ''
    }
    switch (scheme) {
      ${server.proxyForHttp ? `case 'http': return ${buildProxyServerString(server.proxyForHttp)};` : ''}
      ${server.proxyForHttps ? `case 'https': return ${buildProxyServerString(server.proxyForHttps)};` : ''}
      ${server.proxyForFtp ? `case 'ftp': return ${buildProxyServerString(server.proxyForFtp)};` : ''}   
      default:
        return ${buildProxyServerString(server.fallbackProxy)};
    }
  }`;
}

function buildProxyServerString(server: ProxyServer, withQuote = true) {
  const hostPort = `${server.host}:${server.port}`;
  const wrap = (str: string) => (withQuote ? `"${str}"` : str);
  switch (server.scheme) {
    case chrome.proxy.Scheme.HTTP:
      return wrap(`PROXY ${hostPort}`);
    case chrome.proxy.Scheme.HTTPS:
      return wrap(`HTTPS ${hostPort}`);
    case chrome.proxy.Scheme.SOCKS4:
      return wrap(`SOCKS ${hostPort}`);
    case chrome.proxy.Scheme.SOCKS5:
      return wrap(`SOCKS5 ${hostPort}; SOCKS ${hostPort}`);
  }
}
