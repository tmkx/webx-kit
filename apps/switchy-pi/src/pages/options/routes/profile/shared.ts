import { CableIcon, LucideIcon, ServerIcon } from 'lucide-react';
import { type Profile as ProfileType } from '@/schemas';

export const profileIcons: Record<ProfileType['profileType'], LucideIcon> = {
  FixedProfile: ServerIcon,
  SwitchProfile: CableIcon,
};
