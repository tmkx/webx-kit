import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  activeProfileIdAtom,
  deleteProfileAtom,
  loadableActiveProfileIdAtom,
  profileFamily,
  profileListAtom,
} from '@/atoms/profile';

export const useProfile = (profileId: string) => useAtom(profileFamily(profileId));
export const useProfileValue = (profileId: string) => useAtomValue(profileFamily(profileId));

export const useProfileList = () => useAtomValue(profileListAtom);
export const useActiveProfileId = () => useAtom(activeProfileIdAtom);
export const useLoadableActiveProfileId = () => useAtomValue(loadableActiveProfileIdAtom);

export const useDeleteProfile = () => useSetAtom(deleteProfileAtom);
