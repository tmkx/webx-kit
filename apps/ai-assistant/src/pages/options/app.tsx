import { useEffect, useRef } from 'react';
import { Button, Form, Toast } from '@douyinfe/semi-ui';
import { useSemiTheme } from '@/hooks/use-theme';

interface FormValues {
  apiKey: string;
}

export const App = () => {
  useSemiTheme();
  const formRef = useRef<Form<FormValues>>(null);

  useEffect(() => {
    chrome.storage.local.get('GOOGLE_API_KEY', ({ GOOGLE_API_KEY }) => {
      formRef.current?.formApi.setValue('apiKey', GOOGLE_API_KEY || '');
    });
  }, []);

  const handleSubmit = async (formValues: FormValues) => {
    await chrome.storage.local.set({ GOOGLE_API_KEY: formValues.apiKey });
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
