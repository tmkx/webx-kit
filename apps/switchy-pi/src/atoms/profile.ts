import { atom } from 'jotai';
import { RESET, atomFamily, atomWithStorage, loadable, unwrap } from 'jotai/utils';
import type { LiteralUnion } from 'react-hook-form';
import type { Profile } from '@/schemas';
import { createStorage } from '@webx-kit/storage';
import { BuiltinProfile } from '@/schemas/proxy';
import { withResolvers } from '@/utils/promise';
import { configStorage } from './config';
import { proxyModeAtom, proxySetting } from './proxy';

export const profileStorage = createStorage({ prefix: 'profile:' });

export const profileListAtom = unwrap(
  atomWithStorage<string[]>('profiles-list', [], configStorage),
  (): string[] => []
);

export const profileFamily = atomFamily((name: string) => atomWithStorage<Profile | null>(name, null, profileStorage));

type ActiveProfile = LiteralUnion<BuiltinProfile, string>;

const customModes: ActiveProfile[] = ['fixed_servers', 'pac_script'];

const baseActiveProfileIdAtom = atomWithStorage<string | null>('active-profile', null, undefined, { getOnInit: true });
export const activeProfileIdAtom = atom(
  async (get): Promise<ActiveProfile | null> => {
    const mode = await get(proxyModeAtom);
    if (mode && customModes.includes(mode)) return get(baseActiveProfileIdAtom);
    return mode;
  },
  async (_get, set, profileId: ActiveProfile) => {
    const { promise, resolve, reject } = withResolvers<void>();

    const handleResolve = () => {
      set(baseActiveProfileIdAtom, profileId);
      resolve();
    };

    if (BuiltinProfile.safeParse(profileId).success && !customModes.includes(profileId)) {
      proxySetting.set({ value: { mode: profileId } satisfies chrome.proxy.ProxyConfig }, handleResolve);
    }

    const profile: Profile | null = await profileStorage.getItem(profileId);

    switch (profile?.profileType) {
      case 'FixedProfile': {
        proxySetting.set(
          {
            value: {
              mode: 'fixed_servers' satisfies BuiltinProfile,
              rules: {
                singleProxy: profile.fallbackProxy,
                proxyForHttp: profile.proxyForHttp,
                proxyForHttps: profile.proxyForHttps,
                proxyForFtp: profile.proxyForFtp,
                bypassList: profile.bypassList.map((item) => item.pattern),
              },
            } satisfies chrome.proxy.ProxyConfig,
          },
          handleResolve
        );
        return;
      }
      case 'SwitchProfile': {
      }
      default:
        reject(`Unhandled: ${profile?.profileType}`);
    }

    return promise;
  }
);
export const loadableActiveProfileIdAtom = loadable(activeProfileIdAtom);

export const deleteProfileAtom = atom(null, async function (get, set, profileId: string): Promise<string | undefined> {
  const activeProfileId = await get(activeProfileIdAtom);
  if (!activeProfileId) throw new Error(`Unknown active profile`);
  const profileList = await get(profileListAtom);
  const prevIndex = profileList.indexOf(profileId);
  const newProfileList = profileList.filter((item) => item !== profileId);
  await set(profileListAtom, newProfileList);
  await set(profileFamily(profileId), RESET);
  if (profileId === activeProfileId) await set(activeProfileIdAtom, 'system');
  return newProfileList[prevIndex] || newProfileList[newProfileList.length - 1];
});
