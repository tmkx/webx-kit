import React, { useEffect, useState } from 'react';
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

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async ev => {
    ev.preventDefault();
    await setAPIKey(value);
  };

  return (
    <div className="flex-center h-full flex-col text-slate-700">
      <Form className="flex w-96 flex-col gap-2 px-2 py-4" onSubmit={handleSubmit}>
        <TextField
          name="apiKey"
          label="API Key"
          type="password"
          description="Gemini Pro API Key"
          value={value}
          onChange={setValue}
        />
        <div className="text-right">
          <Button type="submit">Save</Button>
        </div>
      </Form>
    </div>
  );
};
