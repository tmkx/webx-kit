import { useAtomValue } from 'jotai';
import { notControllableReasonAtom, proxySettingValue } from './atoms/proxy';

export const useNotControllableReason = () => useAtomValue(notControllableReasonAtom);

export const useProxySettingValue = () => useAtomValue(proxySettingValue);
