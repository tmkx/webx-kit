import { useEffect, useState } from 'react';
import { Button, ConfigProvider } from '@douyinfe/semi-ui';
import { GoogleGenerativeAI } from '@google/generative-ai';
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
        <Button theme="solid" type="primary" onClick={logSelectedText}>
          Log selected Text
        </Button>
      </div>
    </ConfigProvider>
  );
};

let genAI: GoogleGenerativeAI | undefined;

const GOOGLE_API_KEY = 'GOOGLE_API_KEY';
chrome.storage.local.get(GOOGLE_API_KEY).then(({ GOOGLE_API_KEY }) => {
  if (!GOOGLE_API_KEY)
    return console.warn(
      "`GOOGLE_API_KEY` is not provided. update the api key by executing `chrome.storage.local.set({ GOOGLE_API_KEY: 'XXX' })`"
    );
  genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
});

async function logSelectedText() {
  const selection = getSelection();
  if (!selection || selection.isCollapsed) return;
  const { rangeCount } = selection;
  let text = '';
  for (let i = 0; i < rangeCount; ++i) {
    text += selection.getRangeAt(i).cloneContents().textContent;
  }
  console.log('Selected text:', text);

  if (!genAI) {
    return console.warn('skipped calling gemini-pro');
  }

  const result = await genAI.getGenerativeModel({ model: 'gemini-pro' }).generateContentStream({
    contents: [
      {
        role: 'user',
        parts: [{ text: 'Translate the following text to Chinese:\n' + text }],
      },
    ],
  });
  for await (const token of result.stream || []) {
    console.log('RECEIVE', token.text());
  }
}
