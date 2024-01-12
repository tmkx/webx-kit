import { useState } from 'react';
import { Button, ConfigProvider, Tooltip } from '@douyinfe/semi-ui';
import './global.less';

export const App = () => {
  const [count, setCount] = useState(0);
  return (
    <ConfigProvider getPopupContainer={() => window.__webxRoot as unknown as HTMLElement}>
      <Tooltip content="Beautiful">
        <Button type="primary" onClick={() => setCount(count + 1)}>
          {count}
        </Button>
      </Tooltip>
    </ConfigProvider>
  );
};
