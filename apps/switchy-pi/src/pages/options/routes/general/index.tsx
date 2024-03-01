import { useProxySettingValue } from '@/hooks';
import { NormalLayout } from '../layout';

export function General() {
  const value = useProxySettingValue();
  return (
    <NormalLayout title="General">
      <pre>
        <code>{JSON.stringify(value)}</code>
      </pre>
    </NormalLayout>
  );
}
