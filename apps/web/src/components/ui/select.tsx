import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Select as SelectPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { floatingZ, useDialogDepth } from '../../lib/z-stack';
import { MENU_LABEL, MENU_PANEL, MENU_SEPARATOR, menuRow, type MenuRowSize } from './menu-recipe';
import { TRIGGER_CARET_CLASS, TRIGGER_ICON_SIZE, triggerVariants, type TriggerVariantProps } from './trigger-variants';

const SELECT_PANEL = cn(MENU_PANEL, 'max-h-96 min-w-56 overflow-hidden');

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export type SelectTriggerProps = Omit<React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>, 'size'> & TriggerVariantProps & { arrow?: boolean };

export const SelectTrigger = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Trigger>, SelectTriggerProps>(({ className, children, variant, size, arrow = true, ...props }, ref) => (
  <SelectPrimitive.Trigger ref={ref} data-slot="select-trigger" className={cn(triggerVariants({ variant, size }), className)} {...props}>
    {children}
    {arrow ? <SelectPrimitive.Icon asChild><ChevronDown className={cn(TRIGGER_CARET_CLASS, TRIGGER_ICON_SIZE[size ?? 'sm'])} /></SelectPrimitive.Icon> : null}
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

export const SelectScrollUpButton = React.forwardRef<React.ElementRef<typeof SelectPrimitive.ScrollUpButton>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>>(({ className, ...props }, ref) => <SelectPrimitive.ScrollUpButton ref={ref} className={cn('flex cursor-default items-center justify-center py-1', className)} {...props}><ChevronUp className="size-4" /></SelectPrimitive.ScrollUpButton>);
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

export const SelectScrollDownButton = React.forwardRef<React.ElementRef<typeof SelectPrimitive.ScrollDownButton>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>>(({ className, ...props }, ref) => <SelectPrimitive.ScrollDownButton ref={ref} className={cn('flex cursor-default items-center justify-center py-1', className)} {...props}><ChevronDown className="size-4" /></SelectPrimitive.ScrollDownButton>);
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

export const SelectContent = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Content>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>>(({ className, children, position = 'popper', style, ...props }, ref) => {
  const depth = useDialogDepth();
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content ref={ref} data-slot="select-content" className={cn(SELECT_PANEL, position === 'popper' && 'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1', className)} style={{ zIndex: floatingZ(depth), ...style }} position={position} {...props}>
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport className={position === 'popper' ? 'h-(--radix-select-trigger-height) w-full min-w-[calc(var(--radix-select-trigger-width)-8px)]' : undefined}>{children}</SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});
SelectContent.displayName = SelectPrimitive.Content.displayName;

export const SelectLabel = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Label>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>>(({ className, ...props }, ref) => <SelectPrimitive.Label ref={ref} data-slot="select-label" className={cn(MENU_LABEL, className)} {...props} />);
SelectLabel.displayName = SelectPrimitive.Label.displayName;

export const SelectItem = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Item>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & { size?: MenuRowSize; description?: React.ReactNode }>(({ className, children, size = 'md', description, ...props }, ref) => (
  <SelectPrimitive.Item ref={ref} data-slot="select-item" className={cn(menuRow(size, 'default'), description && 'items-start [&>[data-slot=select-item-indicator]]:top-2', className)} {...props}>
    <span data-slot="select-item-indicator" className="absolute right-3 flex size-3.5 items-center justify-center"><SelectPrimitive.ItemIndicator><Check className="size-4" /></SelectPrimitive.ItemIndicator></span>
    {description ? <div className="flex min-w-0 flex-col gap-0.5"><SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText><span className="max-w-[260px] text-[11px] leading-snug text-muted-foreground">{description}</span></div> : <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>}
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

export const SelectSeparator = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Separator>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>>(({ className, ...props }, ref) => <SelectPrimitive.Separator ref={ref} data-slot="select-separator" className={cn(MENU_SEPARATOR, className)} {...props} />);
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;
