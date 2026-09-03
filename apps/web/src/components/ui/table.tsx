import type * as React from 'react';

import { cn } from '@/lib/utils';

function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-hidden rounded-md border border-border bg-popover"
    >
      <div className="overflow-x-auto">
        <table
          data-slot="table"
          className={cn('w-full caption-bottom text-sm', className)}
          {...props}
        />
      </div>
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      data-slot="table-header"
      className={cn('[&_tr]:border-b border-border bg-accent', className)}
      {...props}
    />
  );
}
function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  );
}
function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn('border-t border-border bg-popover-foreground/5 font-medium', className)}
      {...props}
    />
  );
}
function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        'border-b border-border transition-colors hover:bg-popover-foreground/5 data-[state=selected]:bg-popover-foreground/5',
        className,
      )}
      {...props}
    />
  );
}
function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'px-5 py-2 text-left align-middle text-sm font-normal whitespace-nowrap text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}
function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot="table-cell"
      className={cn('px-5 py-2 align-middle whitespace-nowrap', className)}
      {...props}
    />
  );
}
function TableCaption({ className, ...props }: React.ComponentProps<'caption'>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('mt-4 text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow };
