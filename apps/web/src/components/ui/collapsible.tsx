import { Collapsible as CollapsiblePrimitive } from 'radix-ui';
import type * as React from 'react';

import { cn } from '@/lib/utils';

export function Collapsible({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

export function CollapsibleTrigger({
  className,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      className={cn('cursor-pointer', className)}
      {...props}
    />
  );
}

export function CollapsibleContent({
  className,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      className={cn(
        'overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up',
        className,
      )}
      {...props}
    />
  );
}
