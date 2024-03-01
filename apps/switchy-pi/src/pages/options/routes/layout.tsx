import { MenuSeparator } from '@/components';

export interface NormalLayoutProps {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function NormalLayout(props: NormalLayoutProps) {
  return (
    <div>
      <div className="flex items-center gap-2 my-4 justify-between pr-4 min-h-10">
        <div className="text-2xl">{props.title}</div>
        <div>{props.action}</div>
      </div>
      <MenuSeparator className="mx-0 my-4" />
      <div>{props.children}</div>
    </div>
  );
}
