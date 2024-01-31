import { useEffect, useMemo, useRef, useState } from 'react';
import { Flex, IconButton, Popover, Separator, Theme } from '@radix-ui/themes';
import { LanguagesIcon, ListTreeIcon, Loader2Icon } from 'lucide-react';
import {
  autoUpdatePosition,
  computePosition,
  isPageInDark,
  isSelectionValid,
  rangeToReference,
} from '@webx-kit/runtime/content-scripts';
import { createTrpcHandler } from '@webx-kit/messaging/content-script';
import '@radix-ui/themes/styles.css';
import clsx from 'clsx';
import type { AppRouter } from '@/background/router';
import { Provider, ScopedPopoverContent, ScopedTooltip } from './features/provider';
import './global.less';

const { client } = createTrpcHandler<AppRouter>({});

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
    client.generateContentStream.subscribe(
      {
        prompt: 'Translate the following text to Chinese:\n' + text,
      },
      {
        onData(token) {
          setContent((prev) => prev + token);
        },
        onError(err) {
          console.log('Translate Error', { err });
          setIsLoading(false);
        },
        onComplete() {
          setIsLoading(false);
        },
      }
    );
  };

  const handleSummarize = async (text: string) => {
    if (!text) {
      return console.warn('skipped calling gemini-pro');
    }

    setContent('');
    setIsLoading(true);
    client.generateContentStream.subscribe(
      {
        prompt: 'Summarize the following text to Chinese:\n' + text,
      },
      {
        onData(token) {
          setContent((prev) => prev + token);
        },
        onError(err) {
          console.log('Translate Error', { err });
          setIsLoading(false);
        },
        onComplete() {
          setIsLoading(false);
        },
      }
    );
  };

  return (
    <Provider>
      <Theme
        ref={containerRef}
        tabIndex={visible ? undefined : -1}
        className={clsx('absolute transition-opacity', visible ? 'opacity-100' : 'opacity-0 pointer-events-none')}
        style={rootStyle}
        appearance={isDarkMode ? 'dark' : 'light'}
        accentColor="blue"
        grayColor="slate"
      >
        <Popover.Root open={visible && !!selectedText && !!content}>
          <Popover.Trigger>
            <Flex className="w-max">
              <ScopedTooltip content="Translate">
                <IconButton
                  variant="solid"
                  disabled={isLoading}
                  onClick={() => {
                    handleTranslate(selectedText);
                  }}
                >
                  {isLoading ? <Loader2Icon className="animate-spin" size={16} /> : <LanguagesIcon size={16} />}
                </IconButton>
              </ScopedTooltip>
              <ScopedTooltip content="Summarize">
                <IconButton
                  variant="solid"
                  disabled={isLoading}
                  onClick={() => {
                    handleSummarize(selectedText);
                  }}
                >
                  {isLoading ? <Loader2Icon className="animate-spin" size={16} /> : <ListTreeIcon size={16} />}
                </IconButton>
              </ScopedTooltip>
            </Flex>
          </Popover.Trigger>
          <ScopedPopoverContent className="w-96">
            <div>{selectedText}</div>
            <Separator my="3" size="4" />
            <div>{content}</div>
          </ScopedPopoverContent>
        </Popover.Root>
      </Theme>
    </Provider>
  );
};
