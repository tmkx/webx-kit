import * as z from 'zod';
import { ProxyServer } from './proxy';

const BaseProfile = z.object({
  name: z.string(),
  color: z.string(),
});

const BypassListItem = z.object({
  conditionType: z.string(),
  pattern: z.string(),
});

const FixedProfile = BaseProfile.extend({
  profileType: z.literal('FixedProfile'),
  fallbackProxy: ProxyServer,
  proxyForHttp: ProxyServer.optional(),
  proxyForHttps: ProxyServer.optional(),
  proxyForFtp: ProxyServer.optional(),
  bypassList: BypassListItem.array(),
});

const SwitchProfile = BaseProfile.extend({
  profileType: z.literal('SwitchProfile'),
});

const Profile = z.union([FixedProfile, SwitchProfile]);

export interface FixedProfile extends z.infer<typeof FixedProfile> {}
export interface SwitchProfile extends z.infer<typeof SwitchProfile> {}
export type Profile = FixedProfile | SwitchProfile;

export function createDefaultProfile(name: string): FixedProfile {
  return {
    profileType: 'FixedProfile',
    name,
    color: '#000',
    fallbackProxy: {
      scheme: chrome.proxy.Scheme.HTTP,
      host: 'example.com',
      port: 80,
    },
    bypassList: [
      { conditionType: '', pattern: '127.0.0.1' },
      { conditionType: '', pattern: '[::1]' },
      { conditionType: '', pattern: 'localhost' },
    ],
  };
}
