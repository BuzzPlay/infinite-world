import type { SceneOptionSnapshot } from '@infinite-world/api-contract';

import { Button } from '../ui/button';
import { useTranslation } from '../../i18n/use-translation';

interface BranchChoicePanelProps {
  options: SceneOptionSnapshot[];
  selectedOptionId: string | null;
  onSelect: (option: SceneOptionSnapshot) => void;
}

export function BranchChoicePanel({ options, selectedOptionId, onSelect }: BranchChoicePanelProps) {
  const { t } = useTranslation();
  if (!options.length) return null;

  return (
    <section
      className="pointer-events-auto w-full max-w-3xl rounded-md border border-border bg-background/95 p-2.5 text-foreground shadow-lg backdrop-blur-md sm:p-3"
      aria-label={t('dashboard.nextSceneChoices')}
    >
      <div className="mb-2 flex items-center justify-between gap-3 px-1 text-xs sm:text-sm">
        <strong className="font-medium">{t('dashboard.pickWhatHappens')}</strong>
        <span className="text-[11px] text-muted-foreground">
          {selectedOptionId ? t('dashboard.choiceSelected') : t('dashboard.chooseDirection')}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const selected = option.id === selectedOptionId;
          return (
            <Button
              key={option.id}
              type="button"
              variant="ghost"
              className={`min-h-14 justify-start gap-3 rounded-md border border-border bg-card px-3 text-left text-card-foreground shadow-xs transition-[background-color,box-shadow] hover:bg-accent hover:text-accent-foreground ${selected ? 'border-ring bg-accent ring-1 ring-ring/50' : ''}`}
              aria-pressed={selected}
              onClick={() => onSelect(option)}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-sm font-semibold text-foreground">
                {option.label}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{option.title}</span>
              <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                {t('dashboard.votes', { count: option.votes })}
              </span>
            </Button>
          );
        })}
      </div>
    </section>
  );
}
