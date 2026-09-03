import { cn } from '@/lib/utils';

export type MenuRowSize = 'sm' | 'md' | 'lg';
export type MenuRowTone = 'default' | 'destructive';

const MENU_ROW_SIZE: Record<MenuRowSize, string> = {
  sm: 'px-2.5 py-1 text-sm',
  md: 'px-3 py-2.5 text-sm',
  lg: 'px-3.5 py-2 text-base',
};

const MENU_ROW_BASE =
  'relative flex w-full cursor-default items-center gap-2 rounded-[calc(var(--radius)-3px)] font-normal outline-none select-none transition-colors duration-150 ease-out data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0';

const MENU_ROW_TONE: Record<MenuRowTone, string> = {
  default:
    'text-foreground/80 hover:bg-primary/10 hover:text-foreground focus:bg-primary/10 focus:text-foreground data-highlighted:bg-primary/10 data-highlighted:text-foreground data-[state=open]:bg-primary/10 data-[state=open]:text-foreground',
  destructive:
    'text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-highlighted:bg-destructive/10 data-highlighted:text-destructive',
};

export function menuRow(size: MenuRowSize, tone: MenuRowTone, className?: string) {
  return cn(MENU_ROW_BASE, MENU_ROW_SIZE[size], MENU_ROW_TONE[tone], className);
}

export const FLOATING_PANEL_SURFACE =
  'border-border rounded-[10px] border bg-popover text-popover-foreground shadow-md';
export const FLOATING_PANEL_MOTION =
  'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ease-out';
export const FLOATING_PANEL = cn(FLOATING_PANEL_SURFACE, FLOATING_PANEL_MOTION);
export const MENU_PANEL = cn(FLOATING_PANEL, 'p-1');
export const MENU_PANEL_STATIC = cn(FLOATING_PANEL_SURFACE, 'p-1');
export const MENU_LABEL = 'px-2.5 py-1 text-xs font-medium tracking-normal text-muted-foreground';
export const MENU_SEPARATOR = 'bg-foreground/10 -mx-1 my-1 h-px';
export const MENU_SHORTCUT = 'ml-auto text-xs tracking-widest opacity-60';
