import { useEffect, useMemo, useRef, useState } from 'react';
import { LanguagesIcon, ListTreeIcon, Loader2Icon } from 'lucide-react';
import { unstable_createSelectionMenu as createSelectionMenu, isPageInDark } from '@webx-kit/runtime/content-scripts';
import { createTrpcClient } from '@webx-kit/messaging/client';
import clsx from 'clsx';
import type { AppRouter } from '@/background/router';
import { DialogTrigger, TooltipTrigger } from 'react-aria-components';
import { Button, Popover, Tooltip } from '@/components';
import { Provider } from './features/provider';
import './global.less';

const { client } = createTrpcClient<AppRouter>({});

export const App = () => {
  const [visible, setVisible] = useState(false);
  const [rootStyle, setRootStyle] = useState<React.CSSProperties>();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [content, setContent] = useState('');
  const isDarkMode = useMemo(isPageInDark, [visible]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return createSelectionMenu({
      ignore: window.__webxRoot,
      positionOptions: {
        strategy: 'absolute',
        placement: 'top',
      },
      getFloating: () => containerRef.current,
      onVisibleChange(visible) {
        setVisible(visible);
        if (!visible) {
          setSelectedText('');
          setContent('');
        }
      },
      onRangeChange(range) {
        setSelectedText(range.toString().trim());
      },
      onPositionChange(position) {
        setRootStyle({ transform: `translate(${position.x}px, ${position.y}px)` });
      },
    });
  }, []);

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
      <div
        ref={containerRef}
        tabIndex={visible ? undefined : -1}
        className={clsx(
          'absolute transition-opacity z-[2147483647]',
          isDarkMode && 'dark',
          visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        style={rootStyle}
      >
        <DialogTrigger isOpen={visible && !!selectedText && !!content} onOpenChange={setVisible}>
          <div className="w-max">
            <TooltipTrigger>
              <Button
                className="px-2"
                isDisabled={isLoading}
                // TODO: Change to `onPress` after the release of [this PR](https://github.com/adobe/react-spectrum/pull/6046).
                onPressEnd={() => {
                  handleTranslate(selectedText);
                }}
              >
                {isLoading ? <Loader2Icon className="animate-spin" size={16} /> : <LanguagesIcon size={16} />}
              </Button>
              <Tooltip>Translate</Tooltip>
            </TooltipTrigger>
            <TooltipTrigger>
              <Button
                className="px-2"
                isDisabled={isLoading}
                onPressEnd={() => {
                  handleSummarize(selectedText);
                }}
              >
                {isLoading ? <Loader2Icon className="animate-spin" size={16} /> : <ListTreeIcon size={16} />}
              </Button>
              <Tooltip>Summarize</Tooltip>
            </TooltipTrigger>
          </div>
          <Popover className="w-[512px] p-4">
            <div>{selectedText}</div>
            <div className="h-[1px] my-3 bg-slate-300/40 dark:bg-slate-200/20" />
            <div>{content}</div>
          </Popover>
        </DialogTrigger>
      </div>
    </Provider>
  );
};
