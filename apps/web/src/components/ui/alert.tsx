import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { Item, ItemActions, ItemContent, ItemMedia, ItemTitle } from './item';
import { cn } from '@/lib/utils';

const alertVariants = cva('w-full rounded-md', {
  variants: {
    variant: {
      default: 'bg-popover text-foreground',
      destructive: 'text-destructive bg-popover [&_[data-slot=item-media]_svg]:text-current',
      warning: 'text-brand-orange bg-brand-orange/10 [&_[data-slot=item-media]_svg]:text-current',
    },
  },
  defaultVariants: { variant: 'default' },
});

function AlertMedia({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof ItemMedia>) {
  return (
    <ItemMedia
      data-slot="alert-media"
      variant={variant}
      className={cn(
        'mt-0 shrink-0 self-start [&_svg]:pointer-events-none [&_svg]:shrink-0',
        className,
      )}
      {...props}
    />
  );
}

function AlertContent({ className, ...props }: React.ComponentProps<typeof ItemContent>) {
  return <ItemContent data-slot="alert-content" className={className} {...props} />;
}

function AlertTitle({ className, ...props }: React.ComponentProps<typeof ItemTitle>) {
  return (
    <ItemTitle
      data-slot="alert-title"
      className={cn('line-clamp-1 min-h-4 tracking-tight', className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'text-sm leading-normal font-medium text-muted-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary [&_p]:leading-relaxed',
        className,
      )}
      {...props}
    />
  );
}

function AlertActions({ className, ...props }: React.ComponentProps<typeof ItemActions>) {
  return <ItemActions data-slot="alert-actions" className={className} {...props} />;
}

function Alert({
  className,
  variant,
  children,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  const media: React.ReactNode[] = [];
  const content: React.ReactNode[] = [];
  const actions: React.ReactNode[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) {
      if (child != null) content.push(child);
      return;
    }
    if (child.type === AlertMedia) media.push(child);
    else if (child.type === AlertActions) actions.push(child);
    else if (
      child.type === AlertContent ||
      child.type === AlertTitle ||
      child.type === AlertDescription
    )
      content.push(child);
    else media.push(<AlertMedia key={media.length}>{child}</AlertMedia>);
  });

  const hasContent = content.some(
    (child) => React.isValidElement(child) && child.type === AlertContent,
  );
  return (
    <Item
      role="alert"
      data-slot="alert"
      variant="outline"
      size="sm"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {media}
      {content.length > 0 ? (
        hasContent ? (
          content
        ) : (
          <ItemContent data-slot="alert-content">{content}</ItemContent>
        )
      ) : null}
      {actions}
    </Item>
  );
}

export { Alert, AlertActions, AlertContent, AlertDescription, AlertMedia, AlertTitle };
