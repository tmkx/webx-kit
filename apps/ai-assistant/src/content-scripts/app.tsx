import { useEffect, useState } from 'react';
import { Button, ConfigProvider, Tooltip } from '@douyinfe/semi-ui';
import clsx from 'clsx';
import './global.less';

export const App = () => {
  const [visible, setVisible] = useState(false);
  const [rootStyle, setRootStyle] = useState<React.CSSProperties>({ left: 0, top: 0 });

  useEffect(() => {
    const ac = new AbortController();
    document.addEventListener(
      'mouseup',
      async (ev) => {
        if (ev.composedPath().some((target) => target === window.__webxRoot)) return;
        // getSelection after a tick, because the selection may be cleared after "mouseup"
        await new Promise((resolve) => setTimeout(resolve));
        const selection = getSelection();
        if (!selection || selection.isCollapsed) return setVisible(false);
        setVisible(true);
        setRootStyle({ left: ev.pageX, top: ev.pageY });
      },
      { signal: ac.signal }
    );
    return () => ac.abort();
  }, []);

  return (
    <ConfigProvider getPopupContainer={() => window.__webxRoot as unknown as HTMLElement}>
      <div className={clsx('absolute', visible ? 'block' : 'hidden')} style={rootStyle}>
        <Tooltip content="Beautiful">
          <Button theme="solid" type="primary" onClick={logSelectedText}>
            Log selected Text
          </Button>
        </Tooltip>
      </div>
    </ConfigProvider>
  );
};

function logSelectedText() {
  const selection = getSelection();
  if (!selection || selection.isCollapsed) return;
  const { rangeCount } = selection;
  let text = '';
  for (let i = 0; i < rangeCount; ++i) {
    text += selection.getRangeAt(i).cloneContents().textContent;
  }
  console.log('Selected text:', text);
}
