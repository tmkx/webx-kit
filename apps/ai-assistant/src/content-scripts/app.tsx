import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, ButtonGroup, Card, ConfigProvider, Spin, Tooltip } from '@douyinfe/semi-ui';
import { IconBriefStroked, IconLanguage } from '@douyinfe/semi-icons';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { isPageInDark, computePosition, isSelectionValid } from '@webx-kit/runtime/content-scripts';
import clsx from 'clsx';
import './global.less';

// hack for missing button loading rotate keyframes
Spin.name;

export const App = () => {
  const [visible, setVisible] = useState(false);
  const [rootStyle, setRootStyle] = useState<React.CSSProperties>();
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
        if (!isSelectionValid(selection)) return setVisible(false);
        if (!containerRef.current) return;
        const result = await computePosition(selection.getRangeAt(0), containerRef.current, {
          placement: 'top',
        });
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

  const handleSummarize = async (text: string) => {
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
            parts: [{ text: 'Summarize the following text to Chinese:\n' + text }],
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
        <ButtonGroup className="w-max">
          <Tooltip content="Translate" clickTriggerToHide>
            <Button
              theme="solid"
              type="primary"
              loading={isLoading}
              icon={<IconLanguage />}
              onClick={() => {
                const selectedText = getSelectedText();
                if (!selectedText) return;
                handleTranslate(selectedText);
              }}
            />
          </Tooltip>
          <Tooltip content="Summarize" clickTriggerToHide>
            <Button
              theme="solid"
              type="primary"
              loading={isLoading}
              icon={<IconBriefStroked />}
              onClick={() => {
                const selectedText = getSelectedText();
                if (!selectedText) return;
                handleSummarize(selectedText);
              }}
            />
          </Tooltip>
        </ButtonGroup>
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
  if (!isSelectionValid(selection)) return;
  const text = selection.getRangeAt(0).cloneContents().textContent;
  console.log('Selected text:', text);
  return text;
}
