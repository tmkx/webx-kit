import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { apiKeyAtom } from '@/hooks/atoms/config';
import { useBodyThemeClass } from '@/hooks/use-theme';
import { Button, Text, TextField, Theme } from '@radix-ui/themes';
import { KeyRoundIcon } from 'lucide-react';
import '@radix-ui/themes/styles.css';

export const App = () => {
  useBodyThemeClass();
  const [apiKey, setAPIKey] = useAtom(apiKeyAtom);
  const [value, setValue] = useState(apiKey || '');

  useEffect(() => {
    setValue(apiKey || '');
  }, [apiKey]);

  const handleSubmit = () => {
    setAPIKey(value);
  };

  return (
    <Theme className="h-full text-slate-700 flex-center flex-col">
      <div className="w-96">
        <div className="text-sm"></div>
        <Text size="2" color="gray">
          API Key
        </Text>
        <TextField.Root className="mt-2">
          <TextField.Slot>
            <KeyRoundIcon size={16} />
          </TextField.Slot>
          <TextField.Input
            key={apiKey}
            type="password"
            placeholder="Gemini Pro API Key"
            value={value}
            onChange={(ev) => setValue(ev.target.value)}
          />
        </TextField.Root>
        <div className="mt-2 text-right">
          <Button variant="solid" onClick={handleSubmit}>
            Submit
          </Button>
        </div>
      </div>
    </Theme>
  );
};
