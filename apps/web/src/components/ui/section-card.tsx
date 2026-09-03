import * as React from 'react';

import { Card } from './card';
import { cn } from '@/lib/utils';

export interface SectionCardProps {
  title?: React.ReactNode;
  count?: number;
  description?: React.ReactNode;
  action?: React.ReactNode;
  tone?: 'default' | 'destructive';
  flush?: boolean;
  className?: string;
  bodyClassName?: string;
  children?: React.ReactNode;
}

export function SectionCard({
  title,
  count,
  description,
  action,
  tone = 'default',
  flush = false,
  className,
  bodyClassName,
  children,
}: SectionCardProps) {
  const hasHeader = title != null || description != null || action != null;

  return (
    <Card className={cn('gap-0 overflow-hidden py-0', tone === 'destructive' && 'border-destructive/25', className)}>
      {hasHeader ? (
        <div className="flex items-start justify-between gap-3 border-b border-border/60 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            {title != null ? <h2 className="text-base font-semibold text-foreground">{title}{count != null ? <span className="font-normal text-muted-foreground"> ({count})</span> : null}</h2> : null}
            {description != null ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {flush ? children : <div className={cn('px-5 py-5 sm:px-6', bodyClassName)}>{children}</div>}
    </Card>
  );
}
