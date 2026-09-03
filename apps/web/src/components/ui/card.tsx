import type { HTMLAttributes, PropsWithChildren } from 'react';

import { cn } from '@/lib/utils';

export function Card({
  className = '',
  children,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLElement>>) {
  return (
    <section
      className={cn(
        'min-w-0 overflow-hidden rounded-lg border border-border/80 bg-popover text-popover-foreground shadow-xs',
        className,
      )}
      data-slot="card"
      {...props}
    >
      {children}
    </section>
  );
}
