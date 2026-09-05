'use client';

import { CheckCircleIcon, WarningCircleIcon, XCircleIcon } from '@phosphor-icons/react';
import { X } from 'lucide-react';
import type * as React from 'react';
import { type ExternalToast, toast } from 'sonner';

import { Button } from './button';

const DEFAULT_DURATION = 3000;
const DEFAULT_POSITION = 'bottom-right';

type ToastOptions = Pick<
  ExternalToast,
  'duration' | 'id' | 'onAutoClose' | 'onDismiss' | 'position'
> & {
  description?: string;
};

function ToastMessage({
  message,
  description,
}: {
  message: string;
  description?: React.ReactNode;
}) {
  return (
    <div className="flex grow flex-col items-start gap-1">
      <h2 className="text-sm font-medium">{message}</h2>
      {description ? <p className="text-sm font-medium">{description}</p> : null}
    </div>
  );
}

type ToastTone = 'success' | 'warning' | 'error';

function statusIcon(tone: ToastTone) {
  if (tone === 'success') {
    return <CheckCircleIcon weight="fill" className="size-5 shrink-0 text-brand-green" />;
  }
  if (tone === 'error') {
    return <XCircleIcon className="size-6 shrink-0 text-brand-red" />;
  }
  return <WarningCircleIcon className="size-6 shrink-0 text-brand-yellow" />;
}

function statusToast(message: string, tone: ToastTone, options?: ToastOptions) {
  const isMobile = window.innerWidth <= 768;

  return toast.custom(
    (toastId) => (
      <div className="w-full rounded-[0.64rem] border border-primary/10 bg-background px-4 py-3 text-foreground shadow-lg sm:w-[var(--width)]">
        <div className="flex items-center gap-2">
          <div className="flex grow items-center gap-3">
            <span aria-hidden="true">{statusIcon(tone)}</span>
            <ToastMessage message={message} description={options?.description} />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 p-0 text-primary"
            onClick={() => toast.dismiss(toastId)}
            aria-label="Close notification"
          >
            <X size={16} aria-hidden="true" />
          </Button>
        </div>
      </div>
    ),
    {
      ...(options?.id != null ? { id: options.id } : {}),
      duration: options?.duration ?? DEFAULT_DURATION,
      onAutoClose: options?.onAutoClose,
      onDismiss: options?.onDismiss,
      position: isMobile ? 'top-center' : (options?.position ?? DEFAULT_POSITION),
    },
  );
}

export function successToast(message: string, options?: ToastOptions) {
  return statusToast(message, 'success', options);
}

export function warningToast(message: string, options?: ToastOptions) {
  return statusToast(message, 'warning', options);
}

export function errorToast(message: string, options?: ToastOptions) {
  return statusToast(message, 'error', options);
}

export function dismissToast(id: string | number) {
  toast.dismiss(id);
}
