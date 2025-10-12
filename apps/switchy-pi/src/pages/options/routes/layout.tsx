import React from 'react';
import { MenuSeparator } from '@/components';

export interface NormalLayoutProps {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function NormalLayout(props: NormalLayoutProps) {
  return (
    <div>
      <div className="my-4 flex min-h-10 items-center justify-between gap-2 pr-4">
        <div className="text-2xl">{props.title}</div>
        <div>{props.action}</div>
      </div>
      <MenuSeparator className="mx-0 my-4" />
      <div>{props.children}</div>
    </div>
  );
}
