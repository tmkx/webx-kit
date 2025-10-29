import { AlertCircleIcon, InfoIcon } from 'lucide-react';
import * as React from 'react';
import { chain } from 'react-aria';
import { DialogProps, Heading } from 'react-aria-components';
import { Button } from '../button';
import { Dialog } from '../dialog';

interface AlertDialogProps extends Omit<DialogProps, 'children'> {
  title: string;
  children: React.ReactNode;
  variant?: 'info' | 'destructive';
  actionLabel: string;
  cancelLabel?: string;
  onAction?: () => void;
}

export function AlertDialog({
  title,
  variant,
  cancelLabel,
  actionLabel,
  onAction,
  children,
  ...props
}: AlertDialogProps) {
  return (
    <Dialog role="alertdialog" {...props}>
      {({ close }) => (
        <>
          <Heading slot="title" className="my-0 text-xl leading-6 font-semibold">
            {title}
          </Heading>
          <div
            className={`absolute top-6 right-6 h-6 w-6 stroke-2 ${
              variant === 'destructive' ? 'text-red-500' : 'text-blue-500'
            }`}
          >
            {variant === 'destructive' ? <AlertCircleIcon aria-hidden /> : <InfoIcon aria-hidden />}
          </div>
          <p className="mt-3 text-slate-500 dark:text-zinc-400">{children}</p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onPress={close}>
              {cancelLabel || 'Cancel'}
            </Button>
            <Button
              variant={variant === 'destructive' ? 'destructive' : 'primary'}
              autoFocus
              onPress={chain(onAction, close)}
            >
              {actionLabel}
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
