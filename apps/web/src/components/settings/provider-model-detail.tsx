'use client';

import type { ModelDefinition } from '@infinite-world/api-contract/model-catalog';
import type { LucideIcon } from 'lucide-react';
import { ChevronLeft } from 'lucide-react';
import { ArrowSquareOutIcon as ExternalLink } from '@phosphor-icons/react';

import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { useTranslation, type TranslationValues } from '../../i18n/use-translation';

interface ProviderModelDetailProps {
  providerLabel: string;
  providerIcon: LucideIcon;
  providerUrl: string;
  providerHost: string;
  models: readonly ModelDefinition[];
  onBack: () => void;
  onConnect: () => void;
}

export function ProviderModelDetail({
  providerLabel,
  providerIcon: ProviderIcon,
  providerUrl,
  providerHost,
  models,
  onBack,
  onConnect,
}: ProviderModelDetailProps) {
  const { t } = useTranslation('settings');
  const countLabel = modelCountLabel(t, models.length);

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2 h-7 gap-1 px-2 text-xs text-muted-foreground"
        onClick={onBack}
      >
        <ChevronLeft className="size-3.5 shrink-0" aria-hidden="true" />
        {t('backToProviders')}
      </Button>

      <div className="flex items-center gap-3 rounded-md border border-border bg-popover px-4 py-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
          <ProviderIcon className="size-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1">
            <span className="truncate text-sm font-medium text-foreground">{providerLabel}</span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{countLabel}</p>
        </div>
        <Button type="button" size="sm" className="shrink-0" onClick={onConnect}>
          {t('connect')}
        </Button>
      </div>

      <a
        href={providerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        title={t('openProviderPlatform', { provider: providerLabel })}
        aria-label={t('openProviderPlatform', { provider: providerLabel })}
      >
        <ExternalLink size={14} aria-hidden="true" />
        {providerHost}
      </a>

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label className="text-foreground">
            {t('supportedModels')}
            <span className="font-normal text-muted-foreground"> ({models.length})</span>
          </Label>
          <span className="text-xs text-muted-foreground/60">{countLabel}</span>
        </div>
        {models.length ? (
          <ul className="space-y-2">
            {models.map((model) => (
              <li
                key={model.id}
                className="flex items-start gap-3 rounded-md border border-border bg-popover px-4 py-2.5"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {model.label}
                  </span>
                  <code className="block min-w-0 truncate text-xs text-muted-foreground/60">
                    {model.id}
                  </code>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            {t('noSupportedModels')}
          </p>
        )}
      </section>
    </div>
  );
}

function modelCountLabel(t: (key: string, values?: TranslationValues) => string, count: number) {
  return count === 1 ? t('modelCount', { count }) : t('modelsCount', { count });
}
