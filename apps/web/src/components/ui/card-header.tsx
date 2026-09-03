import type { HTMLAttributes, PropsWithChildren } from 'react';

import { cn } from '@/lib/utils';

export function CardHeader({ className = '', children, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={cn('flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4', className)}
      data-slot="card-header"
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children, ...props }: PropsWithChildren<HTMLAttributes<HTMLHeadingElement>>) {
  return (
    <h2 className={cn('text-sm font-semibold leading-tight text-foreground', className)} data-slot="card-title" {...props}>
      {children}
    </h2>
  );
}

export function CardDescription({ className = '', children, ...props }: PropsWithChildren<HTMLAttributes<HTMLParagraphElement>>) {
  return (
    <p className={cn('mt-1 text-xs leading-normal text-muted-foreground', className)} data-slot="card-description" {...props}>
      {children}
    </p>
  );
}

export function CardAction({ className = '', children, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return <div className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)} data-slot="card-action" {...props}>{children}</div>;
}
