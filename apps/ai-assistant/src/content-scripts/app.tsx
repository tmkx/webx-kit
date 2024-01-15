import { useEffect, useMemo, useState } from 'react';
import { Button, Card, ConfigProvider, Spin } from '@douyinfe/semi-ui';
import { GoogleGenerativeAI } from '@google/generative-ai';
import clsx from 'clsx';
import './global.less';

// hack for missing button loading rotate keyframes
Spin.name;

export const App = () => {
  const [visible, setVisible] = useState(false);
  const [rootStyle, setRootStyle] = useState<React.CSSProperties>({ left: 0, top: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState('');
  const isDarkMode = useMemo(isPageInDark, [visible]);

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

  useEffect(() => {
    if (!visible) setContent('');
  }, [visible]);

  const handleTranslate = async (text: string) => {
    if (!genAI) {
      return console.warn('skipped calling gemini-pro');
    }

    setContent('');
    setIsLoading(true);
    try {
      const result = await genAI.getGenerativeModel({ model: 'gemini-pro' }).generateContentStream({
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Translate the following text to Chinese:\n' + text }],
          },
        ],
      });
      for await (const token of result.stream || []) {
        setContent((prev) => prev + token.text());
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ConfigProvider getPopupContainer={() => window.__webxRoot as unknown as HTMLElement}>
      <div
        className={clsx('absolute', visible ? 'block' : 'hidden', isDarkMode ? 'semi-always-dark' : null)}
        style={rootStyle}
      >
        <Button
          theme="solid"
          type="primary"
          loading={isLoading}
          onClick={() => {
            const selectedText = getSelectedText();
            if (!selectedText) return;
            handleTranslate(selectedText);
          }}
        >
          Translate
        </Button>
        {!content ? null : <Card className="min-w-96">{content}</Card>}
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

function getSelectedText() {
  const selection = getSelection();
  if (!selection || selection.isCollapsed) return;
  const { rangeCount } = selection;
  let text = '';
  for (let i = 0; i < rangeCount; ++i) {
    text += selection.getRangeAt(i).cloneContents().textContent;
  }
  console.log('Selected text:', text);
  return text;
}

function isPageInDark() {
  const { colorScheme, backgroundColor } = getComputedStyle(document.body);
  if (colorScheme === 'dark') return true;
  const bgColor = backgroundColor.match(/rgba?\((\d+), (\d+), (\d+)(, ([\d.]+))?/);
  if (bgColor) {
    // has opacity and is blow 0.1
    if (bgColor[5] && Number(bgColor[5]) < 0.1) return false;
    return Number(bgColor[1]) + Number(bgColor[2]) + Number(bgColor[3]) < (256 / 2) * 3;
  }
  return false;
}
