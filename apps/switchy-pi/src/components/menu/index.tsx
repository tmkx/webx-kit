import { Check } from 'lucide-react';
import {
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  MenuProps as AriaMenuProps,
  MenuItemProps,
  Separator,
  SeparatorProps,
  composeRenderProps,
} from 'react-aria-components';
import { clsx } from 'clsx';
import { DropdownSection, DropdownSectionProps, dropdownItemStyles } from '../list-box';

interface MenuProps<T> extends AriaMenuProps<T> {}

export function Menu<T extends object>(props: MenuProps<T>) {
  return (
    <AriaMenu
      {...props}
      className={clsx(
        'p-1 outline outline-0 max-h-[inherit] overflow-auto [clip-path:inset(0_0_0_0_round_.75rem)]',
        props.className
      )}
    />
  );
}

export function MenuItem(props: MenuItemProps) {
  return (
    <AriaMenuItem {...props} className={dropdownItemStyles}>
      {composeRenderProps(props.children, (children, { selectionMode, isSelected }) => (
        <>
          {selectionMode !== 'none' && (
            <span className="flex items-center w-4">{isSelected && <Check aria-hidden className="w-4 h-4" />}</span>
          )}
          <span className="flex items-center flex-1 gap-2 font-normal truncate group-selected:font-semibold">
            {children}
          </span>
        </>
      ))}
    </AriaMenuItem>
  );
}

export function MenuSeparator(props: SeparatorProps) {
  return <Separator {...props} className="mx-3 my-1 border-b border-gray-300 dark:border-zinc-700" />;
}

export function MenuSection<T extends object>(props: DropdownSectionProps<T>) {
  return <DropdownSection {...props} />;
}
