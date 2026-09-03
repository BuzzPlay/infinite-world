import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,background-color,border-color,box-shadow,opacity,scale,translate] disabled:pointer-events-none disabled:opacity-50  [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none  aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive text-center cursor-pointer shadow-none data-[state=open]:ring-0 focus-visible:outline-none focus-visible:ring-brand-base focus-visible:ring-[0.6px]",

  {
    variants: {
      variant: {
        default: 'bg-foreground text-background hover:bg-foreground/90',
        brand:
          'bg-brand-blue/90 dark:bg-brand-blue/60 text-background dark:text-foreground shadow-xs hover:bg-brand-blue/85 dark:hover:bg-brand-blue/50 transition-colors duration-200 ease-out',
        blue: 'bg-brand-blue text-background dark:text-foreground shadow-xs hover:bg-brand-blue/90',
        'blue-ghost': 'hover:bg-sidebar-accent/40 text-brand-blue',
        'blue-secondary': 'bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20',
        danger:
          'bg-destructive text-background hover:bg-destructive/90 focus-visible:ring-destructive/35 focus-visible:ring-offset-4 focus-visible:ring-2',
        destructive:
          'bg-destructive/80 text-background hover:bg-destructive/85 focus-visible:ring-destructive/35 focus-visible:ring-offset-1 focus-visible:ring-2',
        outline:
          'border border-border bg-transparent text-foreground hover:bg-foreground/5 hover:text-foreground',
        'outline-ghost': 'border border-primary/10 hover:bg-background/50 hover:text-foreground',
        secondary: 'bg-secondary  hover:bg-secondary/90    text-foreground ',
        'secondary-outline': 'bg-secondary hover:bg-secondary border border-border text-foreground',
        sidebar: 'text-sidebar-foreground hover:bg-sidebar-accent/80 ',
        background: 'bg-background hover:bg-background/90  text-foreground ',
        input:
          'bg-input dark:bg-input/30  text-foreground hover:bg-input/95 dark:hover:bg-input/235',
        accent: 'bg-foreground/5 text-accent-foreground hover:bg-foreground/8 rounded-md',
        ghost: 'bg-transparent text-foreground hover:bg-foreground/10 hover:text-foreground',
        muted: 'bg-muted text-foreground hover:bg-muted/90',
        link: 'text-foreground underline-offset-4 hover:underline bg-transparent',
        foreground: 'bg-foreground text-background hover:bg-foreground/90',
        'outline-foreground':
          'border border-foreground/10 bg-foreground/80 hover:bg-foreground/90 text-foreground/80 hover:text-foreground',
        inverse: 'w-fit bg-foreground text-background hover:bg-foreground/95',
        'invert-outline-foreground':
          'border border-background/10 bg-foreground/90 hover:bg-foreground text-background hover:text-background',
        transparent: 'bg-transparent hover:bg-transparent text-foreground',
        text: 'text-muted-foreground hover:text-primary',
        'ghost-input': 'bg-transparent hover:bg-input ',
        'ghost-sidebar': 'bg-transparent hover:bg-sidebar hover:text-sidebar-accent-foreground',
        'outline-sidebar':
          'border border-border bg-transparent hover:bg-sidebar hover:text-sidebar-accent-foreground',

        success: 'bg-brand-green/80 text-background hover:bg-brand-green/85',
        error: 'bg-brand-red/80 text-background hover:bg-brand-red/85',
        info: 'bg-brand-blue/80 text-background hover:bg-brand-blue/85',
        warning: 'bg-brand-yellow/80 text-background hover:bg-brand-yellow/85',
        popover: 'bg-popover text-foreground',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        xs: 'h-7  gap-1.5 px-2.5 rounded-sm has-[>svg]:px-2',
        base: "h-7 gap-1 px-2.5   in-data-[slot=button-group]:rounded-2xl has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        sm: 'h-8  gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10  px-6 has-[>svg]:px-4',
        xl: 'h-12  px-8 has-[>svg]:px-6',
        icon: 'size-7 ',
        'icon-xs': 'size-6 rounded-sm',
        'icon-sm': 'size-7',
        'icon-base': 'size-8 rounded-md',
        'icon-md': 'size-9',
        'icon-lg': 'size-10 rounded-md',
        'magic-sm': 'h-9 px-4 py-2 has-[>svg]:px-3  sm:h-8 sm:gap-1.5 sm:px-3 sm:has-[>svg]:px-2.5',

        toolbar: "h-7 gap-1.5 px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3.5",
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
