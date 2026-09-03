import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from './button';
import { Input, type InputProps } from './input';
import { Textarea, type AutosizeTextAreaProps, type AutosizeTextAreaRef } from './textarea';

export function InputGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="input-group" role="group" className={cn('group/input-group relative flex h-9 min-w-0 w-full items-center rounded-md border border-border bg-transparent transition-[color,box-shadow] outline-none has-[>textarea]:h-auto has-[[data-slot=input-group-control]:focus-visible]:border-brand-blue has-[[data-slot=input-group-control]:focus-visible]:border', className)} {...props} />;
}

const addonVariants = cva('flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium text-muted-foreground select-none [&>kbd]:rounded-[calc(var(--radius)-5px)] [&>svg:not([class*="size-"])]:size-4', {
  variants: {
    align: {
      'inline-start': 'order-first pl-3 has-[>button]:ml-[-0.45rem]',
      'inline-end': 'order-last pr-3 has-[>button]:mr-[-0.45rem]',
      'block-start': 'order-first w-full justify-start px-3 pt-3 group-has-[>input]/input-group:pt-2.5',
      'block-end': 'order-last w-full justify-start px-3 pb-3 group-has-[>input]/input-group:pb-2.5',
    },
  },
  defaultVariants: { align: 'inline-start' },
});

export function InputGroupAddon({ className, align = 'inline-start', ...props }: React.ComponentProps<'div'> & VariantProps<typeof addonVariants>) {
  return <div role="group" data-slot="input-group-addon" data-align={align} className={cn(addonVariants({ align }), className)} onClick={(event) => { if ((event.target as HTMLElement).closest('button')) return; const control = event.currentTarget.parentElement?.querySelector<HTMLInputElement | HTMLTextAreaElement>('input,textarea'); control?.focus(); }} {...props} />;
}

const inputGroupButtonVariants = cva('flex items-center gap-2 text-sm shadow-none', {
  variants: {
    size: {
      xs: 'h-6 gap-1 rounded-[calc(var(--radius)-5px)] px-2 has-[>svg]:px-2 [&>svg:not([class*="size-"])]:size-3.5',
      sm: 'h-8 gap-1.5 rounded-md px-2.5 has-[>svg]:px-2.5',
      'icon-xs': 'size-6 rounded-[calc(var(--radius)-5px)] p-0 has-[>svg]:p-0',
      'icon-sm': 'size-8 p-0 has-[>svg]:p-0',
    },
  },
  defaultVariants: { size: 'xs' },
});

export function InputGroupButton({ className, type = 'button', variant = 'ghost', size = 'xs', ...props }: Omit<ButtonProps, 'size'> & VariantProps<typeof inputGroupButtonVariants>) {
  return <Button type={type} variant={variant} data-size={size} className={cn(inputGroupButtonVariants({ size }), className)} {...props} />;
}

export function InputGroupText({ className, ...props }: React.ComponentProps<'span'>) {
  return <span data-slot="input-group-text" className={cn('flex items-center gap-2 text-sm text-muted-foreground [&_svg:not([class*="size-"])]:size-4', className)} {...props} />;
}

export function InputGroupInput({ className, ...props }: InputProps) {
  return <Input data-slot="input-group-control" className={cn('flex-1 rounded-none border-0 bg-transparent shadow-none focus:border-0 focus:outline-none focus-visible:ring-0', className)} {...props} />;
}

export const InputGroupTextarea = React.forwardRef<AutosizeTextAreaRef, AutosizeTextAreaProps>(({ className, ...props }, ref) => <Textarea ref={ref} data-slot="input-group-control" className={cn('flex-1 rounded-none border-0 bg-transparent py-3 shadow-none focus-visible:ring-0', className)} {...props} />);
InputGroupTextarea.displayName = 'InputGroupTextarea';

export function InputGroupSearch({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="input-group-search" className={cn('relative w-full', className)} {...props} />;
}

export function InputGroupSearchIcon({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="input-group-search-icon" aria-hidden="true" className={cn('pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground [&_svg:not([class*="size-"])]:size-4', className)} {...props} />;
}

export function InputGroupSearchInput({ className, variant = 'transparent', ...props }: InputProps) {
  return <Input data-slot="input-group-search-control" variant={variant} size="md" className={cn('peer pl-9 placeholder:text-muted-foreground/60', className)} {...props} />;
}

export function InputGroupSearchClear({ className, variant = 'ghost', size = 'icon', ...props }: Omit<ButtonProps, 'children'>) {
  return <Button type="button" variant={variant} size={size} aria-label="Clear" data-slot="input-group-search-clear" className={cn('absolute top-1/2 right-2 size-6 -translate-y-1/2 rounded-sm opacity-0 peer-focus:opacity-100', className)} {...props}><X className="size-4 text-muted-foreground" /></Button>;
}
