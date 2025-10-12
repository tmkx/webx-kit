import { Check, ChevronRight } from 'lucide-react';
import {
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  MenuProps as AriaMenuProps,
  MenuItemProps,
  MenuSection as AriaMenuSection,
  MenuSectionProps as AriaMenuSectionProps,
  Separator,
  SeparatorProps,
  composeRenderProps,
  Header,
  Collection,
} from 'react-aria-components';
import { dropdownItemStyles } from '../list-box';

export function Menu<T extends object>(props: AriaMenuProps<T>) {
  return (
    <AriaMenu
      {...props}
      className="max-h-[inherit] overflow-auto p-1 outline-0 [clip-path:inset(0_0_0_0_round_.75rem)]"
    />
  );
}

export function MenuItem(props: MenuItemProps) {
  let textValue = props.textValue || (typeof props.children === 'string' ? props.children : undefined);
  return (
    <AriaMenuItem textValue={textValue} {...props} className={dropdownItemStyles}>
      {composeRenderProps(props.children, (children, { selectionMode, isSelected, hasSubmenu }) => (
        <>
          {selectionMode !== 'none' && (
            <span className="flex w-4 items-center">{isSelected && <Check aria-hidden className="h-4 w-4" />}</span>
          )}
          <span className="group-selected:font-semibold flex flex-1 items-center gap-2 truncate font-normal">
            {children}
          </span>
          {hasSubmenu && <ChevronRight aria-hidden className="absolute right-2 h-4 w-4" />}
        </>
      ))}
    </AriaMenuItem>
  );
}

export function MenuSeparator(props: SeparatorProps) {
  return <Separator {...props} className="mx-3 my-1 border-b border-gray-300 dark:border-zinc-700" />;
}

export interface MenuSectionProps<T> extends AriaMenuSectionProps<T> {
  title?: string;
  items?: any;
}

export function MenuSection<T extends object>(props: MenuSectionProps<T>) {
  return (
    <AriaMenuSection className="after:block after:h-[5px] after:content-[''] first:-mt-[5px]">
      <Header className="sticky -top-[5px] z-10 -mx-1 -mt-px truncate border-y border-y-gray-200 bg-gray-100/60 px-4 py-1 text-sm font-semibold text-gray-500 backdrop-blur-md supports-[-moz-appearance:none]:bg-gray-100 dark:border-y-zinc-700 dark:bg-zinc-700/60 dark:text-zinc-300 [&+*]:mt-1">
        {props.title}
      </Header>
      <Collection items={props.items}>{props.children}</Collection>
    </AriaMenuSection>
  );
}
