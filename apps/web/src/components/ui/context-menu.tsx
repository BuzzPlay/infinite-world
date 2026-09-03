import { Check, ChevronRight } from 'lucide-react';
import { ContextMenu as ContextMenuPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { floatingZ, useDialogDepth } from '../../lib/z-stack';
import { MENU_LABEL, MENU_PANEL, MENU_SEPARATOR, MENU_SHORTCUT, menuRow, type MenuRowSize } from './menu-recipe';

export const ContextMenu = ContextMenuPrimitive.Root;
export const ContextMenuTrigger = ContextMenuPrimitive.Trigger;
export const ContextMenuPortal = ContextMenuPrimitive.Portal;
export const ContextMenuSub = ContextMenuPrimitive.Sub;
export const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;
export const ContextMenuGroup = ContextMenuPrimitive.Group;

const CONTEXT_PANEL = cn(MENU_PANEL, 'min-w-[8rem] origin-(--radix-context-menu-content-transform-origin)');

export const ContextMenuSubTrigger = React.forwardRef<React.ElementRef<typeof ContextMenuPrimitive.SubTrigger>, React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger> & { inset?: boolean; size?: MenuRowSize }>(({ className, inset, size = 'sm', children, ...props }, ref) => (
  <ContextMenuPrimitive.SubTrigger ref={ref} data-slot="context-menu-sub-trigger" className={cn(menuRow(size, 'default'), inset && 'pl-8', className)} {...props}>{children}<ChevronRight className="ml-auto size-3.5 text-muted-foreground" /></ContextMenuPrimitive.SubTrigger>
));
ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName;

export const ContextMenuSubContent = React.forwardRef<React.ElementRef<typeof ContextMenuPrimitive.SubContent>, React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent>>(({ className, sideOffset = 4, style, ...props }, ref) => {
  const depth = useDialogDepth();
  return <ContextMenuPrimitive.SubContent ref={ref} data-slot="context-menu-sub-content" sideOffset={sideOffset} className={cn(CONTEXT_PANEL, 'overflow-hidden', className)} style={{ zIndex: floatingZ(depth), ...style }} {...props} />;
});
ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName;

export const ContextMenuContent = React.forwardRef<React.ElementRef<typeof ContextMenuPrimitive.Content>, React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>>(({ className, style, ...props }, ref) => {
  const depth = useDialogDepth();
  return <ContextMenuPrimitive.Portal><ContextMenuPrimitive.Content ref={ref} data-slot="context-menu-content" className={cn(CONTEXT_PANEL, 'max-h-(--radix-context-menu-content-available-height) overflow-x-hidden overflow-y-auto', className)} style={{ zIndex: floatingZ(depth), ...style }} {...props} /></ContextMenuPrimitive.Portal>;
});
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName;

export const ContextMenuItem = React.forwardRef<React.ElementRef<typeof ContextMenuPrimitive.Item>, React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> & { inset?: boolean; variant?: 'default' | 'destructive'; size?: MenuRowSize }>(({ className, inset, variant = 'default', size = 'sm', ...props }, ref) => <ContextMenuPrimitive.Item ref={ref} data-slot="context-menu-item" className={cn(menuRow(size, variant), inset && 'pl-8', className)} {...props} />);
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName;

export const ContextMenuCheckboxItem = React.forwardRef<React.ElementRef<typeof ContextMenuPrimitive.CheckboxItem>, React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.CheckboxItem> & { reverse?: boolean; size?: MenuRowSize }>(({ className, children, checked, reverse, size = 'sm', ...props }, ref) => <ContextMenuPrimitive.CheckboxItem ref={ref} data-slot="context-menu-checkbox-item" className={cn(menuRow(size, 'default'), reverse ? 'pr-7' : 'pl-7', className)} checked={checked} {...props}><span className={cn('absolute flex size-3.5 items-center justify-center', reverse ? 'right-2.5' : 'left-2.5')}><ContextMenuPrimitive.ItemIndicator><Check className="size-3.5 text-muted-foreground" /></ContextMenuPrimitive.ItemIndicator></span>{children}</ContextMenuPrimitive.CheckboxItem>);
ContextMenuCheckboxItem.displayName = ContextMenuPrimitive.CheckboxItem.displayName;

export const ContextMenuRadioItem = React.forwardRef<React.ElementRef<typeof ContextMenuPrimitive.RadioItem>, React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.RadioItem> & { size?: MenuRowSize; side?: 'left' | 'right' }>(({ className, children, size = 'sm', side = 'right', ...props }, ref) => {
  const indicator = <span className="flex size-3.5 shrink-0 items-center justify-center"><ContextMenuPrimitive.ItemIndicator><Check className="size-3.5 text-muted-foreground" /></ContextMenuPrimitive.ItemIndicator></span>;
  return <ContextMenuPrimitive.RadioItem ref={ref} data-slot="context-menu-radio-item" className={cn(menuRow(size, 'default'), className)} {...props}>{side === 'left' ? indicator : null}<span className="flex min-w-0 flex-1 items-center gap-2">{children}</span>{side === 'right' ? indicator : null}</ContextMenuPrimitive.RadioItem>;
});
ContextMenuRadioItem.displayName = ContextMenuPrimitive.RadioItem.displayName;

export const ContextMenuLabel = React.forwardRef<React.ElementRef<typeof ContextMenuPrimitive.Label>, React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label> & { inset?: boolean }>(({ className, inset, ...props }, ref) => <ContextMenuPrimitive.Label ref={ref} data-slot="context-menu-label" className={cn(MENU_LABEL, inset && 'pl-8', className)} {...props} />);
ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName;

export const ContextMenuSeparator = React.forwardRef<React.ElementRef<typeof ContextMenuPrimitive.Separator>, React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>>(({ className, ...props }, ref) => <ContextMenuPrimitive.Separator ref={ref} data-slot="context-menu-separator" className={cn(MENU_SEPARATOR, className)} {...props} />);
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName;

export function ContextMenuShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span data-slot="context-menu-shortcut" className={cn(MENU_SHORTCUT, className)} {...props} />;
}
