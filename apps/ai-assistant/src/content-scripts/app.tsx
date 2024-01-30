import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, ButtonGroup, Card, Divider, Dropdown, Popover, Spin, Tooltip } from '@douyinfe/semi-ui';
import { IconBriefStroked, IconLanguage, IconMoreStroked } from '@douyinfe/semi-icons';
import {
  autoUpdatePosition,
  computePosition,
  isPageInDark,
  isSelectionValid,
  rangeToReference,
} from '@webx-kit/runtime/content-scripts';
import { client } from '@webx-kit/messaging/content-script';
import clsx from 'clsx';
import { Provider } from './features/provider';
import './global.less';

// hack for missing button loading rotate keyframes
Spin.name;

export const App = () => {
  const [visible, setVisible] = useState(false);
  const [rootStyle, setRootStyle] = useState<React.CSSProperties>();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedText, setSelectedText] = useState('');
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
        setSelectedText(selection.getRangeAt(0).cloneContents().textContent?.trim() || '');
        setVisible(true);
      },
      { signal: ac.signal }
    );
    return () => ac.abort();
  }, []);

  useEffect(() => {
    if (visible) {
      const floatingElement = containerRef.current;
      if (!floatingElement) return;
      const selection = getSelection();
      if (!isSelectionValid(selection)) return;
      const range = selection.getRangeAt(0);

      // TODO: throttle
      const handleUpdatePosition = () => {
        computePosition(range, floatingElement, {
          strategy: 'fixed',
          placement: 'top',
        }).then((result) => {
          setRootStyle({ transform: `translate(${result.x}px, ${result.y}px)` });
        });
      };
      const ac = new AbortController();
      addEventListener('wheel', handleUpdatePosition, { signal: ac.signal });
      addEventListener('scroll', handleUpdatePosition, { signal: ac.signal });
      const cleanup = autoUpdatePosition(rangeToReference(range), floatingElement, handleUpdatePosition);
      return () => {
        cleanup();
        ac.abort();
      };
    } else {
      setSelectedText('');
      setContent('');
    }
  }, [visible]);

  const handleTranslate = async (text: string) => {
    if (!text) {
      return console.warn('skipped calling gemini-pro');
    }

    setContent('');
    setIsLoading(true);
    client.stream(
      { prompt: 'Translate the following text to Chinese:\n' + text },
      {
        next: (token) => setContent((prev) => prev + token),
        error: (err) => {
          console.log('Translate Error', { err });
          setIsLoading(false);
        },
        complete: () => setIsLoading(false),
      }
    );
  };

  const handleSummarize = async (text: string) => {
    if (!text) {
      return console.warn('skipped calling gemini-pro');
    }

    setContent('');
    setIsLoading(true);
    client.stream(
      { prompt: 'Summarize the following text to Chinese:\n' + text },
      {
        next: (token) => setContent((prev) => prev + token),
        error: () => setIsLoading(false),
        complete: () => setIsLoading(false),
      }
    );
  };

  return (
    <Provider>
      <div
        ref={containerRef}
        tabIndex={visible ? undefined : -1}
        className={clsx(
          'absolute transition-opacity',
          visible ? 'opacity-100' : 'opacity-0 pointer-events-none',
          isDarkMode ? 'semi-always-dark' : null
        )}
        style={rootStyle}
      >
        <Popover
          trigger="custom"
          visible={visible && !!selectedText && !!content}
          rePosKey={rootStyle?.transform}
          content={
            <Card className="w-96">
              <div>{selectedText}</div>
              <Divider margin={12} />
              <div>{content}</div>
            </Card>
          }
        >
          <div>
            <ButtonGroup className="w-max">
              <Tooltip content="Translate" clickTriggerToHide>
                <Button
                  theme="solid"
                  type="primary"
                  loading={isLoading}
                  icon={<IconLanguage />}
                  onClick={() => {
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
                    handleSummarize(selectedText);
                  }}
                />
              </Tooltip>
              <Dropdown
                trigger="click"
                position="bottomRight"
                render={
                  <Dropdown.Menu>
                    <Dropdown.Item>Menu Item 1</Dropdown.Item>
                    <Dropdown.Item>Menu Item 2</Dropdown.Item>
                    <Dropdown.Item>Menu Item 3</Dropdown.Item>
                  </Dropdown.Menu>
                }
              >
                <Button theme="solid" type="primary" icon={<IconMoreStroked />} />
              </Dropdown>
            </ButtonGroup>
          </div>
        </Popover>
      </div>
    </Provider>
  );
};
