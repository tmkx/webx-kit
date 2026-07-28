import { DialogProps, Dialog as RACDialog } from 'react-aria-components';
import { cn } from 'tailwind-variants';

export function Dialog(props: DialogProps) {
  return (
    <RACDialog
      {...props}
      className={cn('relative max-h-[inherit] overflow-auto p-6 outline-0 [[data-placement]>&]:p-4', props.className)}
    />
  );
}
