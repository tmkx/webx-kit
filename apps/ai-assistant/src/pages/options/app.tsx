import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { apiKeyAtom } from '@/hooks/atoms/config';
import { useBodyThemeClass } from '@/hooks/use-theme';
import { Button, TextField } from '@/components';
import { Form } from 'react-aria-components';

export const App = () => {
  useBodyThemeClass();
  const [apiKey, setAPIKey] = useAtom(apiKeyAtom);
  const [value, setValue] = useState(apiKey || '');

  useEffect(() => {
    setValue(apiKey || '');
  }, [apiKey]);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (ev) => {
    ev.preventDefault();
    setAPIKey(value);
  };

  return (
    <div className="h-full text-slate-700 flex-center flex-col">
      <Form className="w-96 flex flex-col gap-2" onSubmit={handleSubmit}>
        <TextField
          name="apiKey"
          label="API Key"
          type="password"
          description="Gemini Pro API Key"
          value={value}
          onChange={setValue}
        />
        <div className="text-right">
          <Button type="submit">Submit</Button>
        </div>
      </Form>
    </div>
  );
};
