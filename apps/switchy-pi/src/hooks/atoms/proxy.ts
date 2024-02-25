import { atom } from 'jotai';

export const proxySettingDetailsAtom = atom<chrome.types.ChromeSettingGetResultDetails | null>(null);
proxySettingDetailsAtom.onMount = (set) => {
  chrome.proxy.settings.get({}, set);
};

export const notControllableReasonAtom = atom<'not_controllable' | 'controlled_by_other_extensions' | null>((get) => {
  const settingDetails = get(proxySettingDetailsAtom);
  const levelOfControl = settingDetails?.levelOfControl;
  switch (levelOfControl) {
    case 'not_controllable':
    case 'controlled_by_other_extensions':
      return levelOfControl;
    default:
      return null;
  }
});

export const proxySettingValue = atom((get) => {
  const settingDetails = get(proxySettingDetailsAtom);
  if (!settingDetails) return null;
  return settingDetails.value as chrome.proxy.ProxyConfig;
});
