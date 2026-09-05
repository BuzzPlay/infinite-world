'use client';

import {
  CaretDownIcon,
  CheckIcon,
  KeyIcon,
  PlusIcon,
  SlidersHorizontalIcon,
} from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '../../i18n/use-translation';
import { Button } from '../ui/button';
import {
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandPopover,
  CommandPopoverContent,
  CommandPopoverTrigger,
} from '../ui/command';
import type { GenerationModelOption } from './model-options';

interface ModelSelectorProps {
  label: string;
  value: string;
  options: GenerationModelOption[];
  disabled: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onValueChange: (value: string) => void;
  onConnectProvider: () => void;
  onManageModels: () => void;
}

export function ModelSelector({
  label,
  value,
  options,
  disabled,
  open,
  onOpenChange,
  onValueChange,
  onConnectProvider,
  onManageModels,
}: ModelSelectorProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const availableOptions = useMemo(
    () => options.filter((option) => option.value !== 'none' && !option.disabled),
    [options],
  );
  const current = availableOptions.find((option) => option.value === value);
  const visibleOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return availableOptions;
    return availableOptions.filter(
      (option) =>
        option.label.toLowerCase().includes(query) || option.value.toLowerCase().includes(query),
    );
  }, [availableOptions, search]);

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  const openProviderSettings = (action: () => void) => {
    onOpenChange(false);
    action();
  };

  return (
    <div className="min-w-0">
      <span className="block px-2.5 pb-0.5 pt-1 text-[11px] font-medium leading-none text-muted-foreground">
        {label}
      </span>
      <CommandPopover
        open={disabled ? false : open}
        onOpenChange={(nextOpen) => !disabled && onOpenChange(nextOpen)}
      >
        <CommandPopoverTrigger>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full min-w-0 justify-between rounded-lg px-2.5 text-foreground/70 hover:text-foreground"
            disabled={disabled}
            aria-label={label}
          >
            <span className="min-w-0 truncate font-mono text-xs">
              {current?.label ?? t('dashboard.noModel')}
            </span>
            <CaretDownIcon
              className={cn(
                'size-3 transition-transform duration-200 ease-out',
                open && 'rotate-180',
              )}
              aria-hidden="true"
            />
          </Button>
        </CommandPopoverTrigger>
        <CommandPopoverContent
          side="top"
          align="start"
          sideOffset={8}
          className="w-[min(300px,calc(100vw-1.5rem))]"
        >
          <CommandInput
            compact
            placeholder={t('dashboard.searchModels')}
            value={search}
            onValueChange={setSearch}
            rightElement={
              <div className="-mr-0.5 flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  aria-label={t('dashboard.connectProvider')}
                  title={t('dashboard.connectProvider')}
                  onClick={() => openProviderSettings(onConnectProvider)}
                  className="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <PlusIcon className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={t('dashboard.manageModels')}
                  title={t('dashboard.manageModels')}
                  onClick={() => openProviderSettings(onManageModels)}
                  className="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <SlidersHorizontalIcon className="size-4" aria-hidden="true" />
                </button>
              </div>
            }
          />
          <CommandList className="max-h-72">
            {availableOptions.length === 0 ? (
              <div className="px-3 py-6 text-center">
                <div className="text-sm font-medium text-foreground">
                  {t('dashboard.noModelsAvailable')}
                </div>
                <p className="mx-auto mt-1 max-w-[220px] text-xs leading-5 text-muted-foreground">
                  {t('dashboard.connectProviderDescription')}
                </p>
                <div className="mt-4 flex justify-center">
                  <Button
                    type="button"
                    size="xs"
                    onClick={() => openProviderSettings(onConnectProvider)}
                  >
                    <KeyIcon className="size-3.5" aria-hidden="true" />
                    {t('dashboard.connectProvider')}
                  </Button>
                </div>
              </div>
            ) : visibleOptions.length === 0 ? (
              <div className="px-3 py-5 text-center">
                <div className="text-sm font-medium text-foreground">
                  {t('dashboard.noModelsMatch')}
                </div>
                <p className="mx-auto mt-1 max-w-[220px] text-xs leading-5 text-muted-foreground">
                  {t('dashboard.tryDifferentSearch')}
                </p>
                <div className="mt-4 flex justify-center">
                  <Button type="button" size="xs" variant="outline" onClick={() => setSearch('')}>
                    {t('dashboard.clearSearch')}
                  </Button>
                </div>
              </div>
            ) : (
              <CommandGroup forceMount>
                {visibleOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => {
                      onValueChange(option.value);
                      onOpenChange(false);
                    }}
                    className={cn(
                      'group py-1.5 hover:bg-hover data-[selected=true]:bg-hover',
                      value === option.value && 'bg-active data-[selected=true]:bg-active',
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate font-mono text-xs">
                      {option.label}
                    </span>
                    {value === option.value ? (
                      <CheckIcon className="size-3.5 text-foreground" aria-hidden="true" />
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </CommandPopoverContent>
      </CommandPopover>
    </div>
  );
}
