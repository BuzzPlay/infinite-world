import { Slider as SliderPrimitive } from 'radix-ui';
import * as React from 'react';

import Hint from './hint';
import { cn } from '@/lib/utils';

const NativeSliderThumb = (
  <SliderPrimitive.Thumb
    data-slot="slider-thumb"
    className="border-ring ring-ring/50 relative block size-3.5 shrink-0 rounded-full border bg-white outline-none transition-[color,box-shadow] select-none after:absolute after:-inset-2 after:content-[''] hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3 disabled:pointer-events-none disabled:opacity-50"
  />
);

function NativeSlider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  tooltip,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & {
  tooltip?: React.ReactNode;
}) {
  const values = React.useMemo(
    () => (Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min]),
    [value, defaultValue, min],
  );

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        'relative flex w-full touch-none items-center select-none data-disabled:opacity-50',
        'data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-40 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="bg-brand-base/60 relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="bg-brand-blue absolute select-none data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
        />
      </SliderPrimitive.Track>
      {values.map((_, index) => (
        <React.Fragment key={index}>
          {tooltip == null ? (
            NativeSliderThumb
          ) : (
            <Hint side="top" label={tooltip}>
              {NativeSliderThumb}
            </Hint>
          )}
        </React.Fragment>
      ))}
    </SliderPrimitive.Root>
  );
}

export { NativeSlider };
