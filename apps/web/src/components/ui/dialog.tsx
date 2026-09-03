import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';
import {
  dialogContentZ,
  DialogDepthProvider,
  dialogOverlayZ,
  useDialogDepth,
} from '../../lib/z-stack';
import { Button, buttonVariants } from './button';
import { triggerVariants, type TriggerVariantProps } from './trigger-variants';

export function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return (
    <DialogDepthProvider depth={useDialogDepth() + 1}>
      <DialogPrimitive.Root data-slot="dialog" {...props} />
    </DialogDepthProvider>
  );
}

export const DialogTrigger = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Trigger>,
  Omit<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>, 'size'> & TriggerVariantProps
>(({ className, variant, size, asChild, ...props }, ref) => (
  <DialogPrimitive.Trigger
    ref={ref}
    data-slot="dialog-trigger"
    asChild={asChild}
    className={asChild ? className : cn(triggerVariants({ variant, size }), className)}
    {...props}
  />
));
DialogTrigger.displayName = DialogPrimitive.Trigger.displayName;

export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

export const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, style, ...props }, ref) => {
  const depth = useDialogDepth();
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      data-slot="dialog-overlay"
      className={cn(
        'fixed inset-0 bg-black/65 backdrop-blur-xs duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className,
      )}
      style={{ zIndex: dialogOverlayZ(depth), ...style }}
      {...props}
    />
  );
});
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const dialogVariants = cva(
  'fixed top-1/2 left-1/2 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 border p-5 shadow-lg duration-200 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:max-w-lg sm:rounded-lg',
  {
    variants: {
      variant: {
        default: 'border-muted/60 bg-sidebar',
        transparent: 'border-none bg-transparent p-0',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> &
    VariantProps<typeof dialogVariants> & {
      showCloseButton?: boolean;
      hideCloseButton?: boolean;
      showOverlay?: boolean;
      overlayClassName?: string;
    }
>(
  (
    {
      className,
      children,
      variant,
      showCloseButton = true,
      hideCloseButton,
      showOverlay = true,
      overlayClassName,
      style,
      ...props
    },
    ref,
  ) => {
    const depth = useDialogDepth();
    return (
      <DialogPortal>
        {showOverlay && <DialogOverlay className={overlayClassName} />}
        <DialogPrimitive.Content
          ref={ref}
          data-slot="dialog-content"
          className={cn(dialogVariants({ variant }), className)}
          style={{ zIndex: dialogContentZ(depth), ...style }}
          {...props}
        >
          {children}
          {showCloseButton && !hideCloseButton ? (
            <DialogPrimitive.Close
              data-slot="dialog-close"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon' }),
                'absolute top-3 right-3',
              )}
            >
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPortal>
    );
  },
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

export function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  );
}

export function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<'div'> & { showCloseButton?: boolean }) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    >
      {children}
      {showCloseButton ? (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      ) : null}
    </div>
  );
}

export function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-lg font-semibold leading-none', className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}
