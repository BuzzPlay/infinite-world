import * as React from 'react';

import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from './field';
import { cn } from '@/lib/utils';

export function SettingsRowGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="settings-row-group"
      className={cn('divide-y divide-border overflow-hidden rounded-md border border-border bg-popover', className)}
      {...props}
    />
  );
}

export interface SettingsRowProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  label: React.ReactNode;
  description?: React.ReactNode;
  htmlFor?: string;
  children?: React.ReactNode;
}

export function SettingsRow({
  label,
  description,
  htmlFor,
  children,
  className,
  ...props
}: SettingsRowProps) {
  return (
    <Field
      orientation="horizontal"
      className={cn('!items-center gap-4 px-4 py-3', className)}
      {...props}
    >
      <FieldContent className="min-w-0 flex-1 gap-0">
        {htmlFor ? (
          <FieldLabel htmlFor={htmlFor} className="text-sm font-medium text-foreground">{label}</FieldLabel>
        ) : (
          <FieldTitle className="text-sm font-medium text-foreground">{label}</FieldTitle>
        )}
        {description ? (
          <FieldDescription className="text-xs leading-normal text-muted-foreground text-balance">
            {description}
          </FieldDescription>
        ) : null}
      </FieldContent>
      {children ? <div className="flex shrink-0 items-center justify-end gap-2">{children}</div> : null}
    </Field>
  );
}
