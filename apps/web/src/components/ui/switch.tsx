import { animate, m, useMotionValue } from 'motion/react';
import { Switch as SwitchPrimitive } from 'radix-ui';
import * as React from 'react';

import { spring } from '../../lib/springs';
import { cn } from '@/lib/utils';

export type SwitchProps = Omit<
  React.ComponentProps<typeof SwitchPrimitive.Root>,
  'asChild' | 'checked' | 'defaultChecked' | 'onCheckedChange'
> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: React.ReactNode;
};

const TRACK_WIDTH = 34;
const TRACK_HEIGHT = 20;
const THUMB_SIZE = 16;
const THUMB_OFFSET = 2;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - THUMB_OFFSET * 2;
const PILL_EXTEND = 2;
const PRESS_EXTEND = 4;
const PRESS_SHRINK = 4;
const DRAG_DEAD_ZONE = 2;

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      label,
      checked,
      defaultChecked,
      onCheckedChange,
      disabled = false,
      className,
      id,
      onPointerEnter: onPointerEnterProp,
      onPointerLeave: onPointerLeaveProp,
      onPointerDown: onPointerDownProp,
      onPointerMove: onPointerMoveProp,
      onPointerUp: onPointerUpProp,
      onPointerCancel: onPointerCancelProp,
      ...props
    },
    ref,
  ) => {
    const [uncontrolledChecked, setUncontrolledChecked] = React.useState(defaultChecked ?? false);
    const generatedId = React.useId();
    const controlId = id ?? generatedId;
    const hasMounted = React.useRef(false);
    const [hovered, setHovered] = React.useState(false);
    const [pressed, setPressed] = React.useState(false);
    const dragging = React.useRef(false);
    const didDrag = React.useRef(false);
    const pointerStart = React.useRef<{ clientX: number; originX: number } | null>(null);
    const isChecked = checked ?? uncontrolledChecked;
    const setChecked = React.useCallback(
      (next: boolean) => {
        if (checked === undefined) setUncontrolledChecked(next);
        onCheckedChange?.(next);
      },
      [checked, onCheckedChange],
    );

    const motionX = useMotionValue(isChecked ? THUMB_OFFSET + THUMB_TRAVEL : THUMB_OFFSET);

    React.useEffect(() => {
      hasMounted.current = true;
    }, []);

    const thumbWidth = pressed
      ? THUMB_SIZE + PRESS_EXTEND
      : hovered
        ? THUMB_SIZE + PILL_EXTEND
        : THUMB_SIZE;
    const thumbHeight = pressed ? THUMB_SIZE - PRESS_SHRINK : THUMB_SIZE;
    const thumbY = pressed ? THUMB_OFFSET + PRESS_SHRINK / 2 : THUMB_OFFSET;
    const extraWidth = thumbWidth - THUMB_SIZE;
    const thumbX = isChecked ? THUMB_OFFSET + THUMB_TRAVEL - extraWidth : THUMB_OFFSET;

    React.useEffect(() => {
      if (dragging.current) return;
      if (!hasMounted.current) motionX.set(thumbX);
      else animate(motionX, thumbX, spring.moderate);
    }, [motionX, thumbX]);

    const handlePointerDown = React.useCallback(
      (event: React.PointerEvent<HTMLButtonElement>) => {
        onPointerDownProp?.(event);
        if (
          event.defaultPrevented ||
          disabled ||
          (event.pointerType === 'mouse' && event.button !== 0)
        )
          return;
        setPressed(true);
        dragging.current = false;
        didDrag.current = false;
        pointerStart.current = { clientX: event.clientX, originX: motionX.get() };
        event.currentTarget.setPointerCapture(event.pointerId);
      },
      [disabled, motionX, onPointerDownProp],
    );

    const handlePointerMove = React.useCallback(
      (event: React.PointerEvent<HTMLButtonElement>) => {
        onPointerMoveProp?.(event);
        if (!pointerStart.current) return;
        const delta = event.clientX - pointerStart.current.clientX;
        if (!dragging.current) {
          if (Math.abs(delta) < DRAG_DEAD_ZONE) return;
          dragging.current = true;
        }
        const dragMin = THUMB_OFFSET;
        const dragMax = TRACK_WIDTH - THUMB_OFFSET - (THUMB_SIZE + PRESS_EXTEND);
        motionX.set(Math.max(dragMin, Math.min(dragMax, pointerStart.current.originX + delta)));
      },
      [motionX, onPointerMoveProp],
    );

    const handlePointerUp = React.useCallback(
      (event: React.PointerEvent<HTMLButtonElement>) => {
        onPointerUpProp?.(event);
        if (!pointerStart.current) return;
        setPressed(false);
        if (dragging.current) {
          didDrag.current = true;
          dragging.current = false;
          const dragMin = THUMB_OFFSET;
          const dragMax = TRACK_WIDTH - THUMB_OFFSET - (THUMB_SIZE + PRESS_EXTEND);
          setChecked(motionX.get() > (dragMin + dragMax) / 2);
          requestAnimationFrame(() => {
            didDrag.current = false;
          });
        }
        pointerStart.current = null;
      },
      [motionX, onPointerUpProp, setChecked],
    );

    const handlePointerCancel = React.useCallback(
      (event: React.PointerEvent<HTMLButtonElement>) => {
        onPointerCancelProp?.(event);
        setPressed(false);
        dragging.current = false;
        didDrag.current = false;
        pointerStart.current = null;
      },
      [onPointerCancelProp],
    );

    const control = (
      <SwitchPrimitive.Root
        ref={ref}
        id={controlId}
        data-slot="switch"
        checked={isChecked}
        disabled={disabled}
        tabIndex={0}
        className={cn(
          'relative shrink-0 cursor-pointer touch-none rounded-full outline-none transition-colors duration-100 focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          !label && className,
        )}
        style={{
          width: TRACK_WIDTH,
          height: TRACK_HEIGHT,
          backgroundColor: isChecked ? 'var(--brand-blue)' : 'var(--accent)',
        }}
        onPointerEnter={(event) => {
          onPointerEnterProp?.(event);
          if (event.pointerType === 'mouse') setHovered(true);
        }}
        onPointerLeave={(event) => {
          onPointerLeaveProp?.(event);
          setHovered(false);
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onCheckedChange={(next) => {
          if (!didDrag.current) setChecked(next);
        }}
        {...props}
      >
        <SwitchPrimitive.Thumb asChild>
          <m.span
            className="absolute top-0 left-0 block rounded-full bg-white shadow-sm"
            initial={false}
            style={{ x: motionX }}
            animate={{ y: thumbY, width: thumbWidth, height: thumbHeight }}
            transition={hasMounted.current ? spring.moderate : { duration: 0 }}
          />
        </SwitchPrimitive.Thumb>
      </SwitchPrimitive.Root>
    );

    return label ? (
      <label
        htmlFor={controlId}
        className={cn(
          'relative z-10 flex cursor-pointer items-center gap-2.5 px-3 py-2 select-none',
          disabled && 'pointer-events-none opacity-50',
          className,
        )}
      >
        {control}
        <span
          className={cn(
            'text-sm transition-colors duration-100',
            isChecked ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {label}
        </span>
      </label>
    ) : (
      control
    );
  },
);
Switch.displayName = 'Switch';
