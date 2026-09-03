import type { HTMLAttributes, PropsWithChildren } from 'react';

import { cn } from '@/lib/utils';

export function CardContent({
  className = '',
  children,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div className={cn('px-5 py-4', className)} data-slot="card-content" {...props}>
      {children}
    </div>
  );
}
