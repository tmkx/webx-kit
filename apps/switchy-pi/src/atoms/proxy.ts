import { atom } from 'jotai';
import { BuiltinProfile } from '@/schemas/proxy';
import { syncExternalStateAtom } from '@/utils/atom';

export const proxySetting = chrome.proxy.settings;

export const proxySettingDetailsAtom = syncExternalStateAtom(
  () =>
    new Promise<chrome.types.ChromeSettingOnChangeDetails<chrome.proxy.ProxyConfig>>((resolve) =>
      proxySetting.get({}, resolve)
    ),
  (setSelf) => {
    proxySetting.onChange.addListener(setSelf);
    return () => proxySetting.onChange.removeListener(setSelf);
  }
);

export const notControllableReasonAtom = atom(async (get) => {
  const settingDetails = await get(proxySettingDetailsAtom);
  const levelOfControl = settingDetails?.levelOfControl;
  switch (levelOfControl) {
    case 'not_controllable':
    case 'controlled_by_other_extensions':
      return levelOfControl;
    default:
      return null;
  }
});

export const proxySettingValueAtom = atom(async (get) => {
  const settingDetails = await get(proxySettingDetailsAtom);
  if (!settingDetails) return null;
  return settingDetails.value as chrome.proxy.ProxyConfig;
});

export const proxyModeAtom = atom(async (get) => {
  const proxySettingValue = await get(proxySettingValueAtom);
  if (!proxySettingValue) return null;
  const mode = proxySettingValue.mode as BuiltinProfile;

  if (BuiltinProfile.safeParse(mode).success) return mode;

  return null;
});
