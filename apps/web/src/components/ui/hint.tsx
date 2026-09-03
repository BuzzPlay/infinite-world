import * as React from 'react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

export type HintProps = {
  label?: React.ReactNode;
  content?: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  alignOffset?: number;
  className?: string;
} & React.ComponentProps<typeof Tooltip>;

export default function Hint({
  label,
  content,
  children,
  className,
  side = 'right',
  align = 'center',
  sideOffset = 10,
  alignOffset = 10,
  ...props
}: HintProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip {...props}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} align={align} sideOffset={sideOffset} alignOffset={alignOffset} className={className}>
          {label ?? content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
