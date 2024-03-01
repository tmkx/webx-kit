import { useAtomValue } from 'jotai';
import { notControllableReasonAtom, proxyModeAtom, proxySettingValueAtom } from '@/atoms/proxy';

export const useNotControllableReason = () => useAtomValue(notControllableReasonAtom);

export const useProxySettingValue = () => useAtomValue(proxySettingValueAtom);

export const useProxyMode = () => useAtomValue(proxyModeAtom);
