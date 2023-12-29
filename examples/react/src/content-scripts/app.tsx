import { useState } from 'react';
import { Button, Tooltip } from '@douyinfe/semi-ui';
import logo from '@/assets/text-logo.svg';

export const App = () => {
  const [count, setCount] = useState(0);
  return (
    <div className="fixed z-10 right-16 bottom-16 text-base flex-center flex-col bg-slate-200 px-6 py-4 rounded-xl">
      <img className="h-5" src={logo} alt="Logo" />
      <Tooltip
        content="Beautiful"
        getPopupContainer={() => (window.__webxRoot as unknown as HTMLElement) || document.body}
      >
        <Button type="primary" onClick={() => setCount(count + 1)}>
          {count}
        </Button>
      </Tooltip>
    </div>
  );
};
