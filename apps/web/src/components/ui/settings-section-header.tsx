import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function SettingsSectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4',
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1 text-base">
        <h2 className="text-base font-normal text-foreground-strong text-balance lg:text-xl">
          {title}
        </h2>
        {description ? (
          <p className="max-w-[410px] text-sm font-normal text-foreground-weak text-pretty">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <div className="flex w-full min-w-0 items-center gap-4 sm:w-auto sm:justify-end">
          {action}
        </div>
      ) : null}
    </div>
  );
}
