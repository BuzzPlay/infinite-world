import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

function RadioGroup({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root data-slot="radio-group" className={cn('grid gap-1', className)} {...props} />;
}

type RadioGroupItemProps = React.ComponentProps<typeof RadioGroupPrimitive.Item> & {
  label?: React.ReactNode;
  description?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline';
};

function RadioGroupItem({
  className,
  label,
  description,
  id,
  disabled,
  size = 'md',
  variant = 'default',
  ...props
}: RadioGroupItemProps) {
  const itemId = id ?? React.useId();
  const hasCaption = label != null || description != null;
  const control = (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      id={itemId}
      disabled={disabled}
      className={cn(
        'peer aspect-square size-4 shrink-0 rounded-full border border-muted-foreground/60 bg-transparent transition-[color,box-shadow,border-color,background-color] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-4 data-[state=checked]:border-brand-blue data-[state=checked]:bg-background aria-invalid:border-destructive',
        description != null && 'mt-[3px]',
        !hasCaption && className,
      )}
      {...props}
    />
  );

  if (!hasCaption) return control;

  return (
    <label
      htmlFor={itemId}
      className={cn(
        'flex w-full cursor-pointer gap-3 rounded-md transition-colors hover:bg-foreground/3 has-data-[state=checked]:bg-foreground/6 has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-2',
        description != null ? 'items-start px-3 py-1.5' : 'items-center px-3 py-1.5',
        disabled && 'cursor-not-allowed opacity-50',
        size === 'sm' && 'px-2 py-1',
        size === 'lg' && 'px-4 py-2.5',
        variant === 'outline' && 'border border-border',
        className,
      )}
    >
      {control}
      <span className="flex min-w-0 flex-1 flex-col justify-center">
        {label != null ? <span className="text-sm text-foreground peer-data-[state=checked]:font-medium">{label}</span> : null}
        {description != null ? <span className="text-[13px] text-muted-foreground">{description}</span> : null}
      </span>
    </label>
  );
}

export { RadioGroup, RadioGroupItem };
export type { RadioGroupItemProps };
