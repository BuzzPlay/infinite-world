import { cva } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';
import { NavigationMenu as NavigationMenuPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { Separator } from './separator';

export function NavigationMenu({ className, children, viewport = true, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Root> & { viewport?: boolean }) {
  return <NavigationMenuPrimitive.Root data-slot="navigation-menu" data-viewport={viewport} className={cn('group/navigation-menu relative flex max-w-max flex-1 items-center justify-center', className)} {...props}>{children}{viewport ? <NavigationMenuViewport /> : null}</NavigationMenuPrimitive.Root>;
}

export function NavigationMenuList({ className, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.List>) {
  return <NavigationMenuPrimitive.List data-slot="navigation-menu-list" className={cn('group flex flex-1 list-none items-center justify-center gap-1', className)} {...props} />;
}

export function NavigationMenuItem({ className, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Item>) {
  return <NavigationMenuPrimitive.Item data-slot="navigation-menu-item" className={cn('relative', className)} {...props} />;
}

export const navigationMenuTriggerStyle = cva('group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-[color,box-shadow] outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[state=open]:bg-accent/50 data-[state=open]:text-accent-foreground');

export function NavigationMenuTrigger({ className, children, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Trigger>) {
  return <NavigationMenuPrimitive.Trigger data-slot="navigation-menu-trigger" className={cn(navigationMenuTriggerStyle(), 'group', className)} {...props}>{children}<ChevronDown className="relative top-px ml-1 size-3 transition-transform duration-300 group-data-[state=open]:rotate-180" aria-hidden="true" /></NavigationMenuPrimitive.Trigger>;
}

export function NavigationMenuContent({ className, children, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Content>) {
  return <NavigationMenuPrimitive.Content data-slot="navigation-menu-content" className={cn('top-0 left-0 w-full p-1 data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out md:absolute md:w-auto', className)} {...props}><div className="rounded-sm bg-muted p-0.5">{children}</div></NavigationMenuPrimitive.Content>;
}

export function NavigationMenuViewport({ className, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Viewport>) {
  return <div className="absolute top-full left-0 isolate z-50 flex justify-center"><NavigationMenuPrimitive.Viewport data-slot="navigation-menu-viewport" className={cn('relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full origin-top-center overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:zoom-in-90 md:w-[var(--radix-navigation-menu-viewport-width)]', className)} {...props} /></div>;
}

export function NavigationMenuLink({ className, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Link>) {
  return <NavigationMenuPrimitive.Link data-slot="navigation-menu-link" className={cn('flex flex-col gap-1 rounded-sm p-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 data-[active=true]:bg-accent/50 [&_svg:not([class*="size-"])]:size-4', className)} {...props} />;
}

export function NavigationMenuSeparator({ className, orientation = 'horizontal', ...props }: React.ComponentProps<typeof Separator>) {
  return <Separator data-slot="navigation-menu-separator" orientation={orientation} className={className} {...props} />;
}

export function NavigationMenuIndicator({ className, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Indicator>) {
  return <NavigationMenuPrimitive.Indicator data-slot="navigation-menu-indicator" className={cn('top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:animate-in data-[state=visible]:fade-in', className)} {...props}><div className="relative top-[60%] size-2 rotate-45 rounded-tl-sm bg-border shadow" /></NavigationMenuPrimitive.Indicator>;
}
