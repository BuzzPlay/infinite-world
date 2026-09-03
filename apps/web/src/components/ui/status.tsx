import type * as React from 'react';

import { cn } from '@/lib/utils';

export type StatusTone = 'success' | 'warning' | 'destructive' | 'neutral' | 'info';

export const STATUS_TEXT: Record<StatusTone, string> = {
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  destructive: 'text-destructive',
  info: 'text-blue-600 dark:text-blue-400',
  neutral: 'text-muted-foreground',
};

export const STATUS_BG: Record<StatusTone, string> = {
  success: 'bg-brand-green/10',
  warning: 'bg-brand-yellow/10',
  destructive: 'bg-destructive/10',
  info: 'bg-brand-blue/10',
  neutral: 'bg-popover',
};

export const STATUS_BORDER: Record<StatusTone, string> = {
  success: 'border-brand-green',
  warning: 'border-brand-yellow',
  destructive: 'border-destructive/30',
  info: 'border-brand-blue',
  neutral: 'border-border',
};

export const STATUS_DOT: Record<StatusTone, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  destructive: 'bg-destructive',
  info: 'bg-blue-500',
  neutral: 'bg-muted-foreground',
};

export function statusText(tone: StatusTone) {
  return STATUS_TEXT[tone];
}

export function StatusBadge({
  tone = 'neutral',
  className,
  children,
  ...props
}: React.ComponentProps<'span'> & { tone?: StatusTone }) {
  return (
    <span
      data-slot="status-badge"
      className={cn(
        'inline-flex w-fit items-center gap-1 rounded-2xl px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        STATUS_BG[tone],
        STATUS_TEXT[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function StatusDot({
  tone = 'neutral',
  pulse = false,
  className,
}: {
  tone?: StatusTone;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      data-slot="status-dot"
      className={cn(
        'inline-block size-2 shrink-0 rounded-full',
        STATUS_DOT[tone],
        pulse && 'animate-pulse',
        className,
      )}
      aria-hidden="true"
    />
  );
}

export function DiffStat({
  additions,
  deletions,
  className,
}: {
  additions?: number;
  deletions?: number;
  className?: string;
}) {
  if (!additions && !deletions) return null;
  return (
    <span
      data-slot="diff-stat"
      className={cn('inline-flex items-center gap-1.5 font-mono tabular-nums', className)}
    >
      {additions ? <span className={STATUS_TEXT.success}>+{additions}</span> : null}
      {deletions ? <span className={STATUS_TEXT.destructive}>-{deletions}</span> : null}
    </span>
  );
}
