import { Progress as ProgressPrimitive } from 'radix-ui';
import type * as React from 'react';

import { cn } from '@/lib/utils';

export function Progress({ className, indicatorClassName, value, ...props }: React.ComponentProps<typeof ProgressPrimitive.Root> & { indicatorClassName?: string }) {
  return <ProgressPrimitive.Root data-slot="progress" className={cn('relative h-2 w-full overflow-hidden rounded-full bg-primary/15', className)} value={value} {...props}><ProgressPrimitive.Indicator data-slot="progress-indicator" className={cn('h-full w-full flex-1 bg-primary transition-transform duration-300 ease-out', indicatorClassName)} style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }} /></ProgressPrimitive.Root>;
}
