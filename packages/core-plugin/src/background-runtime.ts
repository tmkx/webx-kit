/// <reference types="@rspack/core/module" />

import type { NormalizeContentScriptsOptions } from './content-script';

const searchParams = new URLSearchParams(__resourceQuery);
const contentScripts: NormalizeContentScriptsOptions['contentScripts'] = JSON.parse(searchParams.get('cs') || '[]');
const isModule: boolean = JSON.parse(searchParams.get('module') || 'false');

// when the background is reactivated, refresh the list of content scripts
chrome.scripting.getRegisteredContentScripts(async (registered) => {
  await chrome.scripting.unregisterContentScripts({ ids: registered.map((cs) => cs.id) });
  await chrome.scripting.registerContentScripts(
    contentScripts
      .map<chrome.scripting.RegisteredContentScript | false>((cs) => {
        return {
          id: cs.name,
          matches: cs.matches,
          // TODO:
          js: cs.js || [`static/js/${cs.name}.js`],
          css: cs.css,
          runAt: cs.run_at,
          allFrames: cs.all_frames,
          excludeMatches: cs.exclude_matches,
          world: cs.world,
        };
      })
      .filter((item): item is chrome.scripting.RegisteredContentScript => !!item)
  );
});

module.hot.addStatusHandler(async (status) => {
  if (status !== 'check') return;
  await Promise.all(
    contentScripts.map(async (cs) => {
      const needRefresh = await hasUpdate(cs.name);
      if (!needRefresh) return;
      await chrome.scripting
        .getRegisteredContentScripts({ ids: [cs.name] })
        .then(chrome.scripting.updateContentScripts);
    })
  );
});

/**
 * has the content script any updates?
 */
async function hasUpdate(csName: string) {
  return fetch(
    // @ts-expect-error publicPath
    `${__webpack_require__.p}${__webpack_require__
      // @ts-expect-error getUpdateManifestFilename
      .hmrF()
      .replace(__webpack_runtime_id__, csName)
      .replace(/\.json$/, isModule ? '.mjs' : '.js')}`
  )
    .then((res) => res.text())
    .then((code) => /^[\/*\s]*".+":/m.test(code));
}
