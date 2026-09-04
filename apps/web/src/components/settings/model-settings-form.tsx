'use client';

import { useState, type FocusEvent } from 'react';
import { Check, Film, LoaderCircle, Sparkles, Trash2, type LucideIcon } from 'lucide-react';
import { ArrowSquareOutIcon as ExternalLink } from '@phosphor-icons/react';

import type { ModelDefinition } from '@infinite-world/api-contract/model-catalog';
import type { ProviderSettings, UpdateProviderSettingsRequest } from '@infinite-world/api-contract';
import { modelsForCapability } from '@infinite-world/api-contract/model-catalog';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useTranslation } from '../../i18n/use-translation';
import { ProviderModelDetail } from './provider-model-detail';

type ProviderKey = 'google' | 'fal';
type ProviderKeyField = 'googleApiKey' | 'falApiKey';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface ModelSettingsFormProps {
  settings: ProviderSettings;
  loading: boolean;
  busy: boolean;
  onSave: (settings: Partial<UpdateProviderSettingsRequest>) => Promise<void>;
}

interface ProviderModelGroup {
  key: ProviderKey;
  keyField: ProviderKeyField;
  label: string;
  icon: LucideIcon;
  providerUrl: string;
  providerHost: string;
  models: readonly ModelDefinition[];
}

type ProviderDefinition = Omit<ProviderModelGroup, 'models'>;

export function ModelSettingsForm({ settings, loading, busy, onSave }: ModelSettingsFormProps) {
  const { t } = useTranslation('settings');
  const [drafts, setDrafts] = useState<Record<ProviderKey, string>>({ google: '', fal: '' });
  const [statuses, setStatuses] = useState<Record<ProviderKey, SaveStatus>>({
    google: 'idle',
    fal: 'idle',
  });
  const [errors, setErrors] = useState<Record<ProviderKey, string | null>>({
    google: null,
    fal: null,
  });
  const [selectedProvider, setSelectedProvider] = useState<ProviderKey | null>(null);
  const disabled = loading || busy;

  const googleProvider: ProviderDefinition = {
    key: 'google',
    keyField: 'googleApiKey',
    label: t('googleProvider'),
    icon: Sparkles,
    providerUrl: 'https://aistudio.google.com/apikey',
    providerHost: 'aistudio.google.com',
  };
  const falProvider: ProviderDefinition = {
    key: 'fal',
    keyField: 'falApiKey',
    label: t('falProvider'),
    icon: Film,
    providerUrl: 'https://fal.ai/dashboard/keys',
    providerHost: 'fal.ai',
  };
  const googleVisionProvider: ProviderModelGroup = {
    ...googleProvider,
    models: modelsForCapability('vision').filter((model) => model.provider === 'google'),
  };
  const falVisionProvider: ProviderModelGroup = {
    ...falProvider,
    models: modelsForCapability('vision').filter((model) => model.provider === 'fal'),
  };
  const falVideoProvider: ProviderModelGroup = {
    ...falProvider,
    models: modelsForCapability('video').filter((model) => model.provider === 'fal'),
  };

  const saveProviderKey = async (provider: ProviderModelGroup, explicitValue?: string) => {
    const value = explicitValue ?? drafts[provider.key].trim();
    if (!value && explicitValue === undefined) return;
    if (statuses[provider.key] === 'saving') return;

    setStatuses((current) => ({ ...current, [provider.key]: 'saving' }));
    setErrors((current) => ({ ...current, [provider.key]: null }));
    try {
      await onSave({ [provider.keyField]: value });
      setDrafts((current) => ({ ...current, [provider.key]: '' }));
      setStatuses((current) => ({ ...current, [provider.key]: 'saved' }));
    } catch (saveError) {
      setStatuses((current) => ({ ...current, [provider.key]: 'error' }));
      setErrors((current) => ({
        ...current,
        [provider.key]: saveError instanceof Error ? saveError.message : t('saveFailed'),
      }));
    }
  };

  const handleProviderBlur = (
    provider: ProviderModelGroup,
    event: FocusEvent<HTMLFieldSetElement>,
  ) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    void saveProviderKey(provider);
  };

  const changeProviderKey = (provider: ProviderModelGroup, value: string) => {
    setDrafts((current) => ({ ...current, [provider.key]: value }));
    setStatuses((current) => ({ ...current, [provider.key]: 'idle' }));
    setErrors((current) => ({ ...current, [provider.key]: null }));
  };

  const clearProviderKey = (provider: ProviderModelGroup) => {
    setDrafts((current) => ({ ...current, [provider.key]: '' }));
    void saveProviderKey(provider, '');
  };

  return (
    <Tabs defaultValue="vision" className="min-w-0 gap-4">
      <TabsList
        type="underline"
        animate="none"
        className="w-full justify-start overflow-x-auto"
        aria-label={t('modelCapabilities')}
      >
        <TabsTrigger value="vision" size="md">
          {t('vision')}
        </TabsTrigger>
        <TabsTrigger value="video" size="md">
          {t('video')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="vision" className="grid min-w-0 gap-4">
        {selectedProvider === 'google' ? (
          <ProviderModelDetail
            providerLabel={googleVisionProvider.label}
            providerIcon={googleVisionProvider.icon}
            providerUrl={googleVisionProvider.providerUrl}
            providerHost={googleVisionProvider.providerHost}
            models={googleVisionProvider.models}
            onBack={() => setSelectedProvider(null)}
            onConnect={() => setSelectedProvider(null)}
          />
        ) : selectedProvider === 'fal' ? (
          <ProviderModelDetail
            providerLabel={falVisionProvider.label}
            providerIcon={falVisionProvider.icon}
            providerUrl={falVisionProvider.providerUrl}
            providerHost={falVisionProvider.providerHost}
            models={falVisionProvider.models}
            onBack={() => setSelectedProvider(null)}
            onConnect={() => setSelectedProvider(null)}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <p className="px-0.5 text-xs text-pretty text-muted-foreground">
              {t('providerKeyInstruction')}
            </p>
            <div className="flex flex-col">
              <ProviderRow
                provider={googleVisionProvider}
                configured={settings.googleApiKeyConfigured}
                value={drafts.google}
                status={statuses.google}
                error={errors.google}
                disabled={disabled}
                onChange={(value) => changeProviderKey(googleVisionProvider, value)}
                onClear={() => clearProviderKey(googleVisionProvider)}
                onBlur={(event) => handleProviderBlur(googleVisionProvider, event)}
                onOpenModels={() => setSelectedProvider('google')}
                modelCountLabel={modelCountLabel(t, googleVisionProvider.models.length)}
              />
              <ProviderRow
                provider={falVisionProvider}
                configured={settings.falApiKeyConfigured}
                value={drafts.fal}
                status={statuses.fal}
                error={errors.fal}
                disabled={disabled}
                onChange={(value) => changeProviderKey(falVisionProvider, value)}
                onClear={() => clearProviderKey(falVisionProvider)}
                onBlur={(event) => handleProviderBlur(falVisionProvider, event)}
                onOpenModels={() => setSelectedProvider('fal')}
                modelCountLabel={modelCountLabel(t, falVisionProvider.models.length)}
              />
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="video" className="grid min-w-0 gap-4">
        {selectedProvider === 'fal' ? (
          <ProviderModelDetail
            providerLabel={falVideoProvider.label}
            providerIcon={falVideoProvider.icon}
            providerUrl={falVideoProvider.providerUrl}
            providerHost={falVideoProvider.providerHost}
            models={falVideoProvider.models}
            onBack={() => setSelectedProvider(null)}
            onConnect={() => setSelectedProvider(null)}
          />
        ) : (
          <ProviderKeySection
            instruction={t('providerKeyInstruction')}
            provider={falVideoProvider}
            configured={settings.falApiKeyConfigured}
            value={drafts.fal}
            status={statuses.fal}
            error={errors.fal}
            disabled={disabled}
            onChange={(value) => changeProviderKey(falVideoProvider, value)}
            onClear={() => clearProviderKey(falVideoProvider)}
            onBlur={(event) => handleProviderBlur(falVideoProvider, event)}
            onOpenModels={() => setSelectedProvider('fal')}
            modelCountLabel={modelCountLabel(t, falVideoProvider.models.length)}
          />
        )}
      </TabsContent>
    </Tabs>
  );
}

function ProviderRow({
  provider,
  configured,
  value,
  status,
  error,
  disabled,
  onChange,
  onClear,
  onBlur,
  onOpenModels,
  modelCountLabel,
}: {
  provider: ProviderModelGroup;
  configured: boolean;
  value: string;
  status: SaveStatus;
  error: string | null;
  disabled: boolean;
  onChange: (value: string) => void;
  onClear: () => void;
  onBlur: (event: FocusEvent<HTMLFieldSetElement>) => void;
  onOpenModels: () => void;
  modelCountLabel: string;
}) {
  const { t } = useTranslation('settings');
  const ProviderIcon = provider.icon;
  return (
    <div className="grid gap-1.5 py-1.5 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] sm:items-start sm:gap-4">
      <div className="flex min-w-0 items-start gap-2.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
          <ProviderIcon className="size-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 pt-0.5">
          <div className="relative flex min-w-0 items-center gap-1">
            <span className="truncate text-sm text-foreground">{provider.label}</span>
            <a
              href={provider.providerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-muted-foreground/50 transition-colors hover:text-foreground"
              title={t('openProviderPlatform', { provider: provider.label })}
              aria-label={t('openProviderPlatform', { provider: provider.label })}
            >
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </div>
          <button
            type="button"
            className="mt-0.5 block cursor-pointer text-xs tabular-nums text-muted-foreground/60 underline underline-offset-2 transition-colors hover:text-foreground"
            onClick={onOpenModels}
            disabled={disabled}
            aria-label={t('viewProviderModels', { provider: provider.label })}
          >
            {modelCountLabel}
          </button>
        </div>
      </div>
      <SecretInput
        value={value}
        configured={configured}
        status={status}
        error={error}
        onChange={onChange}
        onClear={onClear}
        onBlur={onBlur}
        placeholder={t('pasteProviderKey')}
        clearLabel={t('clearProviderApiKey', { provider: provider.label })}
        disabled={disabled}
      />
    </div>
  );
}

function ProviderKeySection({
  instruction,
  ...props
}: {
  instruction: string;
  provider: ProviderModelGroup;
  configured: boolean;
  value: string;
  status: SaveStatus;
  error: string | null;
  disabled: boolean;
  onChange: (value: string) => void;
  onClear: () => void;
  onBlur: (event: FocusEvent<HTMLFieldSetElement>) => void;
  onOpenModels: () => void;
  modelCountLabel: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="px-0.5 text-xs text-pretty text-muted-foreground">{instruction}</p>
      <div className="flex flex-col">
        <ProviderRow {...props} />
      </div>
    </div>
  );
}

function SecretInput({
  value,
  configured,
  status,
  error,
  onChange,
  onClear,
  onBlur,
  placeholder,
  clearLabel,
  disabled,
}: {
  value: string;
  configured: boolean;
  status: SaveStatus;
  error: string | null;
  onChange: (value: string) => void;
  onClear: () => void;
  onBlur: (event: FocusEvent<HTMLFieldSetElement>) => void;
  placeholder: string;
  clearLabel: string;
  disabled: boolean;
}) {
  const { t } = useTranslation('settings');
  const statusLabel = saveStatusLabel(t, status);

  return (
    <fieldset className="m-0 w-full min-w-0 border-0 p-0" onBlur={onBlur}>
      <div className="flex min-w-0 items-center gap-2">
        <Input
          className="min-w-0 flex-1"
          type="password"
          autoComplete="new-password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={configured ? t('savedKeyReplace') : placeholder}
          disabled={disabled}
        />
        {status !== 'idle' ? (
          <span
            role="status"
            title={statusLabel}
            aria-label={statusLabel}
            className="flex size-7 shrink-0 items-center justify-center text-muted-foreground"
          >
            {status === 'saving' ? <LoaderCircle className="size-3.5 animate-spin" /> : null}
            {status === 'saved' ? <Check className="size-3.5 text-brand-green" /> : null}
            {status === 'error' ? <span className="text-xs text-destructive">!</span> : null}
          </span>
        ) : configured && !value ? (
          <Check className="size-3.5 shrink-0 text-brand-green" aria-hidden="true" />
        ) : null}
        {configured || value ? (
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            title={clearLabel}
            aria-label={clearLabel}
            onPointerDown={(event) => event.preventDefault()}
            onClick={onClear}
            disabled={disabled || status === 'saving'}
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </fieldset>
  );
}

function saveStatusLabel(t: ReturnType<typeof useTranslation>['t'], status: SaveStatus) {
  return status === 'saving' ? t('saving') : status === 'error' ? t('saveFailed') : t('saved');
}

function modelCountLabel(t: ReturnType<typeof useTranslation>['t'], count: number) {
  return count === 1 ? t('modelCount', { count }) : t('modelsCount', { count });
}
