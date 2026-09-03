import { AlertDialog as AlertDialogPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';
import {
  dialogContentZ,
  DialogDepthProvider,
  dialogOverlayZ,
  useDialogDepth,
} from '../../lib/z-stack';
import { Button, buttonVariants, type ButtonProps } from './button';

export function AlertDialog({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return (
    <DialogDepthProvider depth={useDialogDepth() + 1}>
      <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
    </DialogDepthProvider>
  );
}

export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
export const AlertDialogPortal = AlertDialogPrimitive.Portal;

export const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, style, ...props }, ref) => {
  const depth = useDialogDepth();
  return (
    <AlertDialogPrimitive.Overlay
      ref={ref}
      data-slot="alert-dialog-overlay"
      className={cn(
        'fixed inset-0 bg-black/65 backdrop-blur-xs data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className,
      )}
      style={{ zIndex: dialogOverlayZ(depth), ...style }}
      {...props}
    />
  );
});
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

export const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content> & {
    overlayClassName?: string;
  }
>(({ className, overlayClassName, style, ...props }, ref) => {
  const depth = useDialogDepth();
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay className={overlayClassName} />
      <AlertDialogPrimitive.Content
        ref={ref}
        data-slot="alert-dialog-content"
        className={cn(
          'fixed top-1/2 left-1/2 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border border-muted/60 bg-sidebar p-5 text-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:max-w-md',
          className,
        )}
        style={{ zIndex: dialogContentZ(depth), ...style }}
        {...props}
      />
    </AlertDialogPortal>
  );
});
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

export function AlertDialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  );
}

export function AlertDialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

export function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn('text-lg font-medium', className)}
      {...props}
    />
  );
}

export function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn('text-[0.9rem] leading-snug text-muted-foreground', className)}
      {...props}
    />
  );
}

export function AlertDialogAction({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action> & {
  variant?: ButtonProps['variant'];
}) {
  return (
    <AlertDialogPrimitive.Action
      className={cn(buttonVariants({ variant, size: 'sm' }), className)}
      {...props}
    />
  );
}

export function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <AlertDialogPrimitive.Cancel
      className={cn(buttonVariants({ variant: 'outline-ghost', size: 'sm' }), className)}
      {...props}
    />
  );
}

export const AlertDialogClose = AlertDialogPrimitive.Cancel;
export { Button };
