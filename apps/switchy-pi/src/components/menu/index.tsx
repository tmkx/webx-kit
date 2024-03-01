import { CheckIcon } from 'lucide-react';
import {
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  MenuProps as AriaMenuProps,
  MenuItemProps as AriaMenuItemProps,
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

interface MenuItemProps<T> extends AriaMenuItemProps<T> {
  icon?: React.ReactNode;
}

export function MenuItem<T extends object>(props: MenuItemProps<T>) {
  return (
    <AriaMenuItem<T>
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        twMerge(className, dropdownItemStyles(renderProps))
      )}
    >
      {composeRenderProps(props.children, (children, { isSelected }) => (
        <>
          <span className="flex items-center w-4">{isSelected ? <CheckIcon aria-hidden size={16} /> : props.icon}</span>
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
