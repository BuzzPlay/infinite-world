import { Popover as PopoverPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { floatingZ, useDialogDepth } from '../../lib/z-stack';
import { FLOATING_PANEL } from './menu-recipe';
import { triggerVariants, type TriggerVariantProps } from './trigger-variants';

export function Popover({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

export const PopoverTrigger = React.forwardRef<React.ElementRef<typeof PopoverPrimitive.Trigger>, Omit<React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>, 'size'> & TriggerVariantProps>(({ className, variant, size, asChild, ...props }, ref) => (
  <PopoverPrimitive.Trigger ref={ref} data-slot="popover-trigger" asChild={asChild} className={asChild ? className : cn(triggerVariants({ variant, size }), className)} {...props} />
));
PopoverTrigger.displayName = PopoverPrimitive.Trigger.displayName;

export const PopoverContent = React.forwardRef<React.ElementRef<typeof PopoverPrimitive.Content>, React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & { container?: HTMLElement }>(({ className, align = 'center', sideOffset = 4, container, style, ...props }, ref) => {
  const depth = useDialogDepth();
  return (
    <PopoverPrimitive.Portal container={container}>
      <PopoverPrimitive.Content ref={ref} data-slot="popover-content" align={align} sideOffset={sideOffset} className={cn(FLOATING_PANEL, 'w-72 p-4 outline-hidden', className)} style={{ zIndex: floatingZ(depth), ...style }} {...props} />
    </PopoverPrimitive.Portal>
  );
});
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export function PopoverAnchor({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

export function PopoverHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="popover-header" className={cn('flex flex-col gap-1 text-sm', className)} {...props} />;
}

export function PopoverTitle({ className, ...props }: React.ComponentProps<'h2'>) {
  return <h2 data-slot="popover-title" className={cn('font-medium', className)} {...props} />;
}

export function PopoverDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return <p data-slot="popover-description" className={cn('text-muted-foreground', className)} {...props} />;
}
