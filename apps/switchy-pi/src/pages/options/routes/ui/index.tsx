import { Label, Radio, RadioGroup } from '@/components';
import { useAtom } from 'jotai';
import { colorSchemeAtom } from '@/atoms/config';
import { NormalLayout } from '../layout';

export function UISettings() {
  return (
    <NormalLayout title="Interface">
      <ColorSchemeSetting />
    </NormalLayout>
  );
}

function ColorSchemeSetting() {
  const [colorScheme, setColorScheme] = useAtom(colorSchemeAtom);
  return (
    <RadioGroup orientation="horizontal" value={colorScheme} onChange={setColorScheme as (value: string) => void}>
      <Label>Color Scheme</Label>
      <Radio value="light">Light</Radio>
      <Radio value="dark">Dark</Radio>
      <Radio value="system">Follow system</Radio>
    </RadioGroup>
  );
}
