import type { PropsWithChildren, ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { StatusBadge, type StatusTone } from '../ui/status';
import { SidebarEdgePeek, SidebarProvider } from '../ui/sidebar';
import { SidebarToggle } from './sidebar-toggle';
import { useTranslation } from '../../i18n/use-translation';

export function PageShell({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <SidebarProvider
      className={cn(
        'min-h-svh min-w-0 w-full max-w-full overflow-x-hidden text-foreground',
        className,
      )}
    >
      {children}
      <SidebarEdgePeek />
    </SidebarProvider>
  );
}

export function PageHeader({
  title,
  context = 'Live World',
  status,
  statusTone,
  action,
}: {
  title: string;
  context?: ReactNode;
  status?: ReactNode;
  statusTone?: StatusTone;
  action?: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <header
      className="flex min-h-[4.5rem] items-center justify-between gap-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm sm:px-6 lg:px-12"
      data-slot="page-header"
    >
      <div className="flex min-w-0 items-center gap-2">
        <SidebarToggle />
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>{t('common.workspace')}</span>
            <span aria-hidden="true">/</span>
            <strong className="font-medium text-foreground">{context}</strong>
          </div>
          <h1 className="mt-1 truncate text-lg font-semibold text-foreground sm:text-xl">
            {title}
          </h1>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {status ? (
          <StatusBadge className="hidden sm:inline-flex" tone={statusTone}>
            {status}
          </StatusBadge>
        ) : null}
        {action}
      </div>
    </header>
  );
}
