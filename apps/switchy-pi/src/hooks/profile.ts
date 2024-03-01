import { useAtom, useAtomValue } from 'jotai';
import { activeProfileIdAtom, profileFamily, profileListAtom } from '@/atoms/profile';

export const useProfile = (profileId: string) => useAtom(profileFamily(profileId));
export const useProfileValue = (profileId: string) => useAtomValue(profileFamily(profileId));

export const useProfileList = () => useAtomValue(profileListAtom);
export const useActiveProfileId = () => useAtom(activeProfileIdAtom);
