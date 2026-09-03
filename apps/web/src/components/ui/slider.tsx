import { Slider as SliderPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

export type SliderProps = React.ComponentProps<typeof SliderPrimitive.Root> & {
  thumbLabel?: string | string[];
  formatValue?: (value: number, index: number) => string;
};

export function Slider({ className, defaultValue, value, min = 0, max = 100, onValueChange, thumbLabel, formatValue, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, ...props }: SliderProps) {
  const [uncontrolledValues, setUncontrolledValues] = React.useState<number[]>(() => Array.isArray(defaultValue) ? defaultValue : [min]);
  const values = Array.isArray(value) ? value : uncontrolledValues;
  const handleValueChange = React.useCallback((next: number[]) => {
    if (value === undefined) setUncontrolledValues(next);
    onValueChange?.(next);
  }, [onValueChange, value]);
  const labelFor = (index: number) => {
    if (Array.isArray(thumbLabel)) return thumbLabel[index];
    if (!thumbLabel && !ariaLabel) return undefined;
    if (values.length < 2) return thumbLabel ?? ariaLabel;
    return `${thumbLabel ?? ariaLabel} ${index === 0 ? 'minimum' : index === values.length - 1 ? 'maximum' : index + 1}`;
  };

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      onValueChange={handleValueChange}
      className={cn(
        'group/slider relative flex w-full cursor-pointer touch-none items-center select-none',
        'data-disabled:pointer-events-none data-disabled:cursor-default data-disabled:opacity-50',
        'data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="bg-primary/10 relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-2 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="bg-primary absolute rounded-full data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
        />
      </SliderPrimitive.Track>
      {values.map((_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          aria-label={labelFor(index)}
          aria-labelledby={ariaLabelledBy}
          aria-valuetext={formatValue ? formatValue(values[index] ?? min, index) : undefined}
          className={cn(
            'bg-primary relative block h-4 w-2 shrink-0 rounded-full',
            'group-data-[orientation=vertical]/slider:h-2 group-data-[orientation=vertical]/slider:w-4',
            'cursor-pointer outline-none after:absolute after:-inset-x-4 after:-inset-y-5 after:content-[""]',
            'duration-fast ease-default transition-[scale,box-shadow]',
            'active:scale-x-150 active:scale-y-125',
            'focus:ring-ring focus:ring-offset-background focus:ring-2 focus:ring-offset-2',
            'focus:outline-2 focus:outline-offset-2 focus:outline-transparent focus:outline-solid',
            'data-disabled:pointer-events-none data-disabled:cursor-default',
          )}
        />
      ))}
    </SliderPrimitive.Root>
  );
}
