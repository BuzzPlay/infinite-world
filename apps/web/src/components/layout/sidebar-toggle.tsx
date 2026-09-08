import { SidebarSimpleIcon as PanelLeft } from '@phosphor-icons/react';

import { cn } from '@/lib/utils';
import { useTranslation } from '../../i18n/use-translation';
import { Button } from '../ui/button';
import Hint from '../ui/hint';
import { useSidebar } from '../ui/sidebar';

export function SidebarToggle({
  className,
  placement = 'inline',
  side = 'bottom',
}: {
  className?: string;
  placement?: 'inline' | 'floating';
  side?: 'top' | 'right' | 'bottom' | 'left';
}) {
  const { state, isMobile, peek, peekEnter, peekLeave, toggleSidebar } = useSidebar();
  const { t } = useTranslation();

  if (isMobile || state === 'expanded') return null;

  const label = peek ? t('common.pinSidebar') : t('common.openSidebar');

  return (
    <Hint label={label} side={side}>
      <Button
        type="button"
        aria-label={label}
        variant="ghost"
        size="icon"
        onClick={(event) => toggleSidebar(event)}
        onPointerEnter={peekEnter}
        onPointerLeave={peekLeave}
        className={cn(
          'hover:bg-sidebar-accent hover:text-sidebar-foreground shrink-0 cursor-pointer items-center justify-center rounded-md transition-[color,background-color,transform] duration-150 ease-out active:scale-[0.96]',
          placement === 'floating' &&
            'absolute left-2 top-2 z-20 border border-border/80 bg-background/90 shadow-sm backdrop-blur-md hover:bg-accent',
          className,
        )}
      >
        <PanelLeft className="cn-rtl-flip size-4" aria-hidden="true" />
      </Button>
    </Hint>
  );
}
