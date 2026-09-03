import * as React from 'react';

import { cn } from '@/lib/utils';

export interface UseAutosizeTextAreaProps {
  textAreaRef: React.MutableRefObject<HTMLTextAreaElement | null>;
  minHeight?: number;
  maxHeight?: number;
  triggerAutoSize: string;
}

export function useAutosizeTextArea({
  textAreaRef,
  triggerAutoSize,
  minHeight = 0,
  maxHeight = Number.MAX_SAFE_INTEGER,
}: UseAutosizeTextAreaProps) {
  React.useLayoutEffect(() => {
    const element = textAreaRef.current;
    if (!element) return;

    element.style.minHeight = `${minHeight}px`;
    element.style.maxHeight = maxHeight < Number.MAX_SAFE_INTEGER ? `${maxHeight}px` : '';
    element.style.height = 'auto';

    const nextHeight = Math.min(Math.max(element.scrollHeight, minHeight), maxHeight);
    element.style.height = `${nextHeight}px`;
  }, [maxHeight, minHeight, textAreaRef, triggerAutoSize]);
}

export type AutosizeTextAreaRef = {
  textArea: HTMLTextAreaElement;
  maxHeight: number;
  minHeight: number;
  focus: () => void;
};

export type AutosizeTextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  maxHeight?: number;
  minHeight?: number;
  variant?: 'default' | 'secondary' | 'outline' | 'accent';
};

export const Textarea = React.forwardRef<AutosizeTextAreaRef, AutosizeTextAreaProps>(
  (
    {
      maxHeight = Number.MAX_SAFE_INTEGER,
      minHeight = 52,
      className,
      onChange,
      value,
      defaultValue,
      variant = 'default',
      ...props
    },
    ref,
  ) => {
    const textAreaRef = React.useRef<HTMLTextAreaElement | null>(null);
    const initialValue = String(value ?? defaultValue ?? '');
    const [triggerAutoSize, setTriggerAutoSize] = React.useState(initialValue);

    React.useEffect(() => {
      setTriggerAutoSize(String(value ?? defaultValue ?? ''));
    }, [defaultValue, value]);

    useAutosizeTextArea({ textAreaRef, triggerAutoSize, maxHeight, minHeight });

    React.useImperativeHandle(
      ref,
      () => ({
        textArea: textAreaRef.current as HTMLTextAreaElement,
        maxHeight,
        minHeight,
        focus: () => textAreaRef.current?.focus(),
      }),
      [maxHeight, minHeight],
    );

    return (
      <textarea
        {...props}
        ref={textAreaRef}
        value={value}
        defaultValue={defaultValue}
        data-slot="textarea"
        data-variant={variant}
        className={cn(
          'border-border bg-input text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex min-h-16 w-full resize-none rounded-lg border px-3 py-2 text-sm font-medium transition-[color] outline-none disabled:cursor-not-allowed disabled:opacity-50',
          'focus:border-brand-blue focus:outline-none',
          variant === 'secondary' && 'border-none bg-input text-secondary-foreground',
          variant === 'outline' && 'border-border bg-input',
          variant === 'accent' && 'border-none bg-foreground/5 text-accent-foreground',
          className,
        )}
        onChange={(event) => {
          setTriggerAutoSize(event.target.value);
          onChange?.(event);
        }}
      />
    );
  },
);
Textarea.displayName = 'Textarea';
