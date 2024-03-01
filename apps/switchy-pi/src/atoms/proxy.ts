import { atom } from 'jotai';
import { BuiltinProfile } from '@/schemas/proxy';

export const proxySetting = chrome.proxy.settings;

export const proxySettingDetailsAtom = atom<chrome.types.ChromeSettingGetResultDetails | null>(null);
proxySettingDetailsAtom.onMount = (set) => {
  proxySetting.get({}, set);
  proxySetting.onChange.addListener(set);
  return () => proxySetting.onChange.removeListener(set);
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

export const proxySettingValueAtom = atom<chrome.proxy.ProxyConfig | null>((get) => {
  const settingDetails = get(proxySettingDetailsAtom);
  if (!settingDetails) return null;
  return settingDetails.value;
});

export const proxyModeAtom = atom((get) => {
  const proxySettingValue = get(proxySettingValueAtom);
  if (!proxySettingValue) return null;
  const mode = proxySettingValue.mode as BuiltinProfile;

  if (BuiltinProfile.safeParse(mode).success) return mode;

  return null;
});
