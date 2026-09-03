import type * as React from 'react';

import { cn } from '@/lib/utils';

export function Message({
  className,
  align = 'start',
  ...props
}: React.ComponentProps<'div'> & { align?: 'start' | 'end' }) {
  return (
    <div
      data-slot="message"
      data-align={align}
      className={cn(
        'flex w-full items-end gap-2.5',
        align === 'end' ? 'flex-row-reverse' : 'flex-row',
        className,
      )}
      {...props}
    />
  );
}

export function MessageGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="message-group" className={cn('flex flex-col gap-1.5', className)} {...props} />
  );
}

export function MessageAvatar({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="message-avatar" className={cn('shrink-0 self-end', className)} {...props} />
  );
}

export function MessageContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="message-content"
      className={cn('flex min-w-0 flex-col gap-1', className)}
      {...props}
    />
  );
}

export function MessageHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="message-header"
      className={cn('flex items-center gap-2 text-xs text-muted-foreground', className)}
      {...props}
    />
  );
}

export function MessageFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="message-footer"
      className={cn('flex items-center gap-2 text-xs text-muted-foreground', className)}
      {...props}
    />
  );
}
