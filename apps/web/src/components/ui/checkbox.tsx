import { Check } from 'lucide-react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

export type CheckboxProps = React.ComponentProps<typeof CheckboxPrimitive.Root> & {
  label?: React.ReactNode;
};

export function Checkbox({ className, label, id, ...props }: CheckboxProps) {
  const generatedId = React.useId();
  const itemId = id ?? generatedId;
  const control = (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      id={itemId}
      className={cn(
        'peer flex size-[18px] shrink-0 items-center justify-center rounded-sm border border-muted-foreground/60 bg-transparent outline-none transition-[color,box-shadow,border-color,background-color] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-brand-blue data-[state=checked]:bg-brand-blue data-[state=checked]:text-background',
        !label && className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current"
      >
        <Check className="size-3" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  if (!label) return control;

  return (
    <label
      htmlFor={itemId}
      className={cn(
        'flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-1.5 transition-colors hover:bg-foreground/5 has-data-[state=checked]:bg-foreground/5 has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-2 has-focus-visible:ring-offset-background',
        props.disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      {control}
      <span className="text-sm text-muted-foreground peer-data-[state=checked]:font-medium peer-data-[state=checked]:text-foreground">
        {label}
      </span>
    </label>
  );
}
