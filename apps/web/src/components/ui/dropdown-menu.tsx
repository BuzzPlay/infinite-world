import { Check, ChevronRight } from 'lucide-react';
import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { floatingZ, useDialogDepth } from '../../lib/z-stack';
import {
  MENU_LABEL,
  MENU_PANEL,
  MENU_PANEL_STATIC,
  MENU_SEPARATOR,
  MENU_SHORTCUT,
  menuRow,
  type MenuRowSize,
} from './menu-recipe';
import { triggerVariants, type TriggerVariantProps } from './trigger-variants';

const DROPDOWN_PANEL = cn(MENU_PANEL, 'min-w-[14rem] overflow-hidden');
const DROPDOWN_SUB_PANEL = cn(MENU_PANEL_STATIC, 'min-w-[14rem] overflow-hidden');

export function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
export const DropdownMenuSub = DropdownMenuPrimitive.Sub;
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

export const DropdownMenuTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Trigger>,
  Omit<React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger>, 'size'> &
    TriggerVariantProps
>(({ className, variant, size, asChild, ...props }, ref) => (
  <DropdownMenuPrimitive.Trigger
    ref={ref}
    data-slot="dropdown-menu-trigger"
    asChild={asChild}
    className={asChild ? className : cn(triggerVariants({ variant, size }), className)}
    {...props}
  />
));
DropdownMenuTrigger.displayName = DropdownMenuPrimitive.Trigger.displayName;

export const DropdownMenuGroup = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Group>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Group
    ref={ref}
    data-slot="dropdown-menu-group"
    className={cn('p-1', className)}
    {...props}
  />
));
DropdownMenuGroup.displayName = DropdownMenuPrimitive.Group.displayName;

export const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
    size?: MenuRowSize;
  }
>(({ className, inset, size = 'sm', children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    data-slot="dropdown-menu-sub-trigger"
    className={cn(menuRow(size, 'default'), inset && 'pl-8', className)}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto size-3.5 text-muted-foreground" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

export const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, sideOffset = 5, style, ...props }, ref) => {
  const depth = useDialogDepth();
  return (
    <DropdownMenuPrimitive.SubContent
      ref={ref}
      data-slot="dropdown-menu-sub-content"
      sideOffset={sideOffset}
      className={cn(DROPDOWN_SUB_PANEL, className)}
      style={{ zIndex: floatingZ(depth), ...style }}
      {...props}
    />
  );
});
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, style, ...props }, ref) => {
  const depth = useDialogDepth();
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(DROPDOWN_PANEL, className)}
        style={{ zIndex: floatingZ(depth), ...style }}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
});
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
    variant?: 'default' | 'destructive';
    size?: MenuRowSize;
  }
>(({ className, inset, variant = 'default', size = 'sm', ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    data-slot="dropdown-menu-item"
    className={cn(menuRow(size, variant), inset && 'pl-8', className)}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

export const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem> & {
    reverse?: boolean;
    size?: MenuRowSize;
  }
>(({ className, children, checked, reverse, size = 'sm', ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    data-slot="dropdown-menu-checkbox-item"
    className={cn(menuRow(size, 'default'), reverse ? 'pr-7' : 'pl-7', className)}
    checked={checked}
    {...props}
  >
    <span
      className={cn(
        'absolute flex size-3.5 items-center justify-center',
        reverse ? 'right-2.5' : 'left-2.5',
      )}
    >
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="size-3.5 text-muted-foreground" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

export const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem> & {
    size?: MenuRowSize;
    side?: 'left' | 'right';
  }
>(({ className, children, size = 'sm', side = 'right', ...props }, ref) => {
  const indicator = (
    <span className="flex size-3.5 shrink-0 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="size-3.5 text-muted-foreground" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
  );
  return (
    <DropdownMenuPrimitive.RadioItem
      ref={ref}
      data-slot="dropdown-menu-radio-item"
      className={cn(menuRow(size, 'default'), className)}
      {...props}
    >
      {side === 'left' ? indicator : null}
      <span className="flex min-w-0 flex-1 items-center gap-2">{children}</span>
      {side === 'right' ? indicator : null}
    </DropdownMenuPrimitive.RadioItem>
  );
});
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

export const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    data-slot="dropdown-menu-label"
    className={cn(MENU_LABEL, inset && 'pl-8', className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

export const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    data-slot="dropdown-menu-separator"
    className={cn(MENU_SEPARATOR, className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

export function DropdownMenuShortcut({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span data-slot="dropdown-menu-shortcut" className={cn(MENU_SHORTCUT, className)} {...props} />
  );
}
