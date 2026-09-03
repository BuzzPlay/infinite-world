import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import { cn } from '@/lib/utils';

const bubbleVariants = cva('relative w-fit max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed', {
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
      muted: 'bg-muted text-muted-foreground',
      tinted: 'bg-brand-blue/10 text-foreground',
      outline: 'border border-border bg-transparent',
      ghost: 'bg-transparent px-0 py-0',
      destructive: 'bg-destructive text-destructive-foreground',
    },
    align: {
      start: 'mr-auto rounded-bl-md',
      end: 'ml-auto rounded-br-md',
    },
  },
  defaultVariants: { variant: 'default', align: 'start' },
});

export function Bubble({ className, variant, align, ...props }: React.ComponentProps<'div'> & VariantProps<typeof bubbleVariants>) {
  return <div data-slot="bubble" data-align={align ?? 'start'} className={cn(bubbleVariants({ variant, align }), className)} {...props} />;
}

export function BubbleContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="bubble-content" className={cn('whitespace-pre-wrap break-words', className)} {...props} />;
}

export function BubbleReactions({ className, side = 'bottom', align = 'end', ...props }: React.ComponentProps<'div'> & { side?: 'top' | 'bottom'; align?: 'start' | 'end' }) {
  return <div data-slot="bubble-reactions" data-side={side} className={cn('flex flex-wrap gap-1', side === 'top' ? '-mt-1 mb-1' : '-mb-1 mt-1', align === 'end' ? 'justify-end' : 'justify-start', className)} {...props} />;
}

export function BubbleGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="bubble-group" className={cn('flex flex-col gap-1', className)} {...props} />;
}

export { bubbleVariants };
