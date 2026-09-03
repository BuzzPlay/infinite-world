import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import { cn } from '@/lib/utils';

const markerVariants = cva('flex items-center gap-1.5 text-xs text-muted-foreground', {
  variants: {
    variant: {
      default: '',
      border: 'border-b border-border pb-2',
      separator: "justify-center before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border before:content-[''] after:content-['']",
    },
  },
  defaultVariants: { variant: 'default' },
});

export function Marker({ className, variant, ...props }: React.ComponentProps<'div'> & VariantProps<typeof markerVariants>) {
  return <div data-slot="marker" className={cn(markerVariants({ variant }), className)} {...props} />;
}

export function MarkerIcon({ className, ...props }: React.ComponentProps<'span'>) {
  return <span data-slot="marker-icon" aria-hidden="true" className={cn('inline-flex shrink-0 items-center [&_svg]:size-3.5', className)} {...props} />;
}

export function MarkerContent({ className, ...props }: React.ComponentProps<'span'>) {
  return <span data-slot="marker-content" className={cn('min-w-0 truncate', className)} {...props} />;
}

export { markerVariants };
