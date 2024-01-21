import { useEffect, useRef } from 'react';
import { Button, Form, Toast } from '@douyinfe/semi-ui';
import { useAtom } from 'jotai';
import { apiKeyAtom } from '@/hooks/atoms/config';
import { useSemiTheme } from '@/hooks/use-theme';

interface FormValues {
  apiKey: string;
}

export const App = () => {
  useSemiTheme();
  const formRef = useRef<Form<FormValues>>(null);
  const [apiKey, setAPIKey] = useAtom(apiKeyAtom);

  useEffect(() => {
    if (apiKey) formRef.current?.formApi.setValue('apiKey', apiKey);
  }, [apiKey]);

  const handleSubmit = async (formValues: FormValues) => {
    setAPIKey(formValues.apiKey);
    Toast.success('Saved');
  };

  return (
    <div className="h-full text-slate-700 flex-center flex-col">
      <div className="w-96">
        <Form<FormValues> ref={formRef} onSubmit={handleSubmit}>
          <Form.Input field="apiKey" label="API Key" mode="password" placeholder="Gemini Pro API Key" />
          <div className="text-right">
            <Button theme="solid" htmlType="submit">
              Submit
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};
