import type { SceneOptionSnapshot } from '@infinite-world/api-contract';
import { LoaderCircle, RefreshCw, Timer } from 'lucide-react';
import { useTranslation } from '../../i18n/use-translation';
import { Button } from '../ui/button';

interface BranchChoicePanelProps {
  options: SceneOptionSnapshot[];
  selectedOptionId: string | null;
  disabled?: boolean;
  regenerating?: boolean;
  onSelect?: (option: SceneOptionSnapshot) => void;
  onRegenerate?: () => void;
  autoEnabled?: boolean;
  autoCountdown?: number | null;
  onAutoToggle?: () => void;
  generating?: boolean;
}

export function BranchChoicePanel({
  options,
  selectedOptionId,
  disabled = false,
  regenerating = false,
  onSelect,
  onRegenerate,
  autoEnabled = false,
  autoCountdown = null,
  onAutoToggle,
  generating = false,
}: BranchChoicePanelProps) {
  const { t } = useTranslation();
  if (!options.length) return null;
  const regenerateLabel = regenerating
    ? t('dashboard.regeneratingOptions')
    : t('dashboard.regenerateOptions');
  const autoLabel = autoEnabled
    ? t('dashboard.disableAutoAdvance')
    : t('dashboard.enableAutoAdvance');

  return (
    <section
      className="pointer-events-auto w-full max-w-2xl rounded-md border border-border bg-background/95 p-2.5 text-foreground shadow-lg backdrop-blur-md"
      aria-label={t('dashboard.nextSceneChoices')}
    >
      <div className="mb-1.5 flex items-center justify-between gap-3 px-0.5 text-xs sm:text-sm">
        <div className="flex min-w-0 items-center gap-2">
          <strong className="shrink-0 font-medium">{t('dashboard.pickWhatHappens')}</strong>
          {generating ? (
            <span
              className="flex min-w-0 items-center gap-1.5 truncate text-xs text-brand-blue"
              role="status"
            >
              <LoaderCircle size={14} className="shrink-0 animate-spin" aria-hidden="true" />
              <span className="truncate">{t('dashboard.generatingNextScene')}</span>
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          {onRegenerate ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={disabled}
              onClick={onRegenerate}
              title={regenerateLabel}
              aria-label={regenerateLabel}
            >
              <RefreshCw className={regenerating ? 'animate-spin' : undefined} aria-hidden="true" />
            </Button>
          ) : null}
          {onAutoToggle ? (
            <Button
              type="button"
              variant={autoEnabled ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs"
              disabled={disabled}
              onClick={onAutoToggle}
              title={autoLabel}
              aria-label={autoLabel}
              aria-pressed={autoEnabled}
            >
              <Timer size={14} aria-hidden="true" />
              <span>{t('dashboard.auto')}</span>
              {autoEnabled && autoCountdown !== null ? (
                <span className="tabular-nums text-muted-foreground">{autoCountdown}s</span>
              ) : null}
            </Button>
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {options.map((option) => {
          const selected = option.id === selectedOptionId;
          return (
            <Button
              key={option.id}
              type="button"
              variant="ghost"
              className={
                `min-h-12 justify-start gap-2.5 rounded-md border bg-card px-2.5 text-left text-card-foreground shadow-xs transition-[background-color,box-shadow,opacity] ${onSelect ? '' : 'disabled:opacity-100'} ` +
                (generating
                  ? selected
                    ? 'border-brand-blue bg-brand-blue/10 ring-1 ring-brand-blue/40 disabled:opacity-100'
                    : 'border-border/60 opacity-45 grayscale'
                  : selected
                    ? 'border-brand-blue bg-brand-blue/10 ring-1 ring-brand-blue/40'
                    : 'border-border hover:bg-accent hover:text-accent-foreground')
              }
              aria-pressed={selected}
              disabled={disabled || !onSelect}
              onClick={() => onSelect?.(option)}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-xs font-semibold text-foreground">
                {option.label}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{option.title}</span>
            </Button>
          );
        })}
      </div>
    </section>
  );
}
