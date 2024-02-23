import { MenuSeparator } from '@/components';

export interface NormalLayoutProps {
  title?: React.ReactNode;
  children: React.ReactNode;
}

export function NormalLayout(props: NormalLayoutProps) {
  return (
    <div>
      <div className="flex my-4">
        <div className="text-2xl">{props.title}</div>
      </div>
      <MenuSeparator className="mx-0 my-4" />
      <div>{props.children}</div>
    </div>
  );
}
