import type { HTMLAttributes, PropsWithChildren } from 'react';

import { cn } from '@/lib/utils';

export function CardFooter({
  className = '',
  children,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={cn('flex items-center px-5 py-4', className)}
      data-slot="card-footer"
      {...props}
    >
      {children}
    </div>
  );
}
