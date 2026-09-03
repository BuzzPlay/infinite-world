import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface SectionProps {
  label?: string;
  action?: ReactNode;
  spacing?: 'tight' | 'default' | 'loose';
  className?: string;
  children: ReactNode;
}

const spacingClasses: Record<NonNullable<SectionProps['spacing']>, string> = {
  tight: 'mt-6',
  default: 'mt-10',
  loose: 'mt-14',
};

export function Section({ label, action, spacing = 'default', className, children }: SectionProps) {
  return (
    <section className={cn(spacingClasses[spacing], 'first:mt-0', className)}>
      {label || action ? <div className="mb-3 flex items-center justify-between"><>{label ? <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">{label}</h3> : <span />}</>{action ? <div className="shrink-0">{action}</div> : null}</div> : null}
      {children}
    </section>
  );
}
