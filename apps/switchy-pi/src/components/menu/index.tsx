import { useCallback } from 'react';
import { Check } from 'lucide-react';
import {
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  MenuProps as AriaMenuProps,
  MenuItemProps,
  MenuItemRenderProps,
  Separator,
  SeparatorProps,
  composeRenderProps,
} from 'react-aria-components';
import { twMerge } from 'tailwind-merge';
import { DropdownSection, DropdownSectionProps, dropdownItemStyles } from '../list-box';

interface MenuProps<T> extends AriaMenuProps<T> {}

export function Menu<T extends object>(props: MenuProps<T>) {
  return (
    <AriaMenu
      {...props}
      className={twMerge(
        'p-1 outline outline-0 max-h-[inherit] overflow-auto [clip-path:inset(0_0_0_0_round_.75rem)]',
        props.className
      )}
    />
  );
}

export function MenuItem(props: MenuItemProps) {
  const classNameProp = useCallback(
    (values: MenuItemRenderProps) =>
      twMerge(
        dropdownItemStyles(values),
        typeof props.className === 'function' ? props.className(values) : props.className
      ),
    [props.className]
  );

  return (
    <AriaMenuItem {...props} className={classNameProp}>
      {composeRenderProps(props.children, (children, { selectionMode, isSelected }) => (
        <>
          {selectionMode !== 'none' && (
            <span className="flex items-center w-4">{isSelected && <Check aria-hidden size={16} />}</span>
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
  return (
    <Separator
      {...props}
      className={twMerge('mx-3 my-1 border-b border-gray-300 dark:border-zinc-700', props.className)}
    />
  );
}

export function MenuSection<T extends object>(props: DropdownSectionProps<T>) {
  return <DropdownSection {...props} />;
}
