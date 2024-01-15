export const manifest = chrome.runtime.getManifest() as chrome.runtime.ManifestV3;

export const isBackground = location.href === chrome.runtime.getURL(manifest.background?.service_worker || '/');
