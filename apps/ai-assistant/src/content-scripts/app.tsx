import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, ConfigProvider, Spin } from '@douyinfe/semi-ui';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { isPageInDark, position } from '@webx-kit/runtime/content-scripts';
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
  const containerRef = useRef<HTMLDivElement>(null);

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
        if (!containerRef.current) return;
        const result = await position(selection.getRangeAt(0), containerRef.current);
        setVisible(true);
        setRootStyle({ position: result.strategy, left: result.x, top: result.y });
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
        ref={containerRef}
        tabIndex={visible ? undefined : -1}
        className={clsx(
          'absolute',
          visible ? '' : 'invisible pointer-events-none',
          isDarkMode ? 'semi-always-dark' : null
        )}
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
