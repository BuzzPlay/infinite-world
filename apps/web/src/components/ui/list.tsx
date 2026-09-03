import type * as React from 'react';

import { cn } from '@/lib/utils';

export function List({ className, ...props }: React.ComponentProps<'ul'>) {
  return <ul data-slot="list" className={cn('divide-y divide-border', className)} {...props} />;
}

export interface ListRowProps {
  leading?: React.ReactNode;
  title: React.ReactNode;
  badges?: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  compact?: boolean;
}

export function ListRow({
  leading,
  title,
  badges,
  subtitle,
  trailing,
  onClick,
  className,
  compact = false,
}: ListRowProps) {
  const interactive = Boolean(onClick);
  return (
    <li>
      <div
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        onClick={onClick}
        onKeyDown={
          interactive
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onClick?.();
                }
              }
            : undefined
        }
        className={cn(
          'group flex items-center gap-3 px-6 py-3',
          interactive &&
            'cursor-pointer transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none',
          className,
        )}
      >
        {leading ? <div className="shrink-0">{leading}</div> : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'truncate text-sm font-medium text-foreground',
                compact && 'leading-none',
              )}
            >
              {title}
            </span>
            {badges}
          </div>
          {subtitle ? (
            <div className={cn(compact ? 'text-xs leading-none' : 'mt-0.5')}>{subtitle}</div>
          ) : null}
        </div>
        {trailing ? <div className="flex shrink-0 items-center gap-1.5">{trailing}</div> : null}
      </div>
    </li>
  );
}
