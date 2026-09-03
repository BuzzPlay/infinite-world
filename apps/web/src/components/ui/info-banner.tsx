import { cva } from 'class-variance-authority';
import * as React from 'react';

import { Alert, AlertActions, AlertDescription, AlertMedia, AlertTitle } from './alert';
import { cn } from '@/lib/utils';
import type { StatusTone } from './status';

export type InfoBannerIcon = React.ComponentType<{ className?: string }> | React.ReactElement<{ className?: string }>;

const bannerVariants = cva('flex flex-wrap items-center gap-2 px-2.5 py-2 text-sm', {
  variants: {
    tone: {
      neutral: 'border border-border',
      info: 'bg-brand-blue/10',
      success: 'bg-brand-green/10',
      warning: 'bg-brand-yellow/10',
      destructive: 'border border-border',
    },
  },
  defaultVariants: { tone: 'neutral' },
});

const titleVariants = cva('w-full max-w-full', {
  variants: {
    tone: { neutral: 'text-foreground', info: 'text-brand-blue', success: 'text-brand-green', warning: 'text-brand-yellow', destructive: 'text-brand-red' },
  },
  defaultVariants: { tone: 'neutral' },
});

export interface InfoBannerProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  tone?: StatusTone;
  icon?: InfoBannerIcon;
  title?: React.ReactNode;
  action?: React.ReactNode;
}

function renderIcon(icon: InfoBannerIcon) {
  if (React.isValidElement(icon)) return React.cloneElement(icon, { className: cn('size-5 shrink-0', icon.props.className) });
  const Icon = icon;
  return <Icon className="size-5 shrink-0" />;
}

export function InfoBanner({ tone = 'neutral', icon, title, action, className, children, ...props }: InfoBannerProps) {
  return <Alert variant={tone === 'destructive' ? 'destructive' : tone === 'warning' ? 'warning' : 'default'} className={cn(bannerVariants({ tone }), className)} {...props}>{icon ? <AlertMedia>{renderIcon(icon)}</AlertMedia> : null}{title ? <AlertTitle className={titleVariants({ tone })}>{title}</AlertTitle> : null}{children ? <AlertDescription>{children}</AlertDescription> : null}{action ? <AlertActions>{action}</AlertActions> : null}</Alert>;
}
