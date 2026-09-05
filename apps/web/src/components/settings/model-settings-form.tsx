'use client';

import type { ProviderSettings, UpdateProviderSettingsRequest } from '@infinite-world/api-contract';
import type { ModelCapability, ModelDefinition } from '@infinite-world/api-contract/model-catalog';
import { modelsForCapability } from '@infinite-world/api-contract/model-catalog';
import {
  CheckCircleIcon as Check,
  ArrowSquareOutIcon as ExternalLink,
  EyeIcon as Eye,
  EyeSlashIcon as EyeSlash,
  XIcon as Remove,
  WarningCircleIcon as Warning,
} from '@phosphor-icons/react';
import { Film, type LucideIcon, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '../../i18n/use-translation';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '../ui/input-group';
import { Loading } from '../ui/loading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { errorToast, successToast } from '../ui/toast';
import { ProviderModelDetail } from './provider-model-detail';

type ProviderKey = 'google' | 'fal';
type ProviderKeyField = 'googleApiKey' | 'falApiKey';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface ModelSettingsFormProps {
  settings: ProviderSettings;
  loading: boolean;
  busy: boolean;
  defaultCapability?: ModelCapability;
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

export function ModelSettingsForm({
  settings,
  loading,
  busy,
  defaultCapability = 'vision',
  onSave,
}: ModelSettingsFormProps) {
  const { t } = useTranslation('settings');
  const [drafts, setDrafts] = useState<Record<ProviderKey, string>>({ google: '', fal: '' });
  const [savedValues, setSavedValues] = useState<Record<ProviderKey, string>>({
    google: '',
    fal: '',
  });
  const [revealed, setRevealed] = useState<Record<ProviderKey, boolean>>({
    google: false,
    fal: false,
  });
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

  const saveProviderKey = async (
    provider: ProviderModelGroup,
    explicitValue?: string,
    allowEmpty = false,
  ) => {
    const value = (explicitValue ?? drafts[provider.key]).trim();
    if (!value && !allowEmpty) return;
    if (!allowEmpty && value === savedValues[provider.key]) {
      setStatuses((current) => ({ ...current, [provider.key]: 'saved' }));
      return;
    }
    if (statuses[provider.key] === 'saving') return;

    setStatuses((current) => ({ ...current, [provider.key]: 'saving' }));
    setErrors((current) => ({ ...current, [provider.key]: null }));
    try {
      await onSave({ [provider.keyField]: value });
      setDrafts((current) => ({ ...current, [provider.key]: value }));
      setSavedValues((current) => ({ ...current, [provider.key]: value }));
      setStatuses((current) => ({ ...current, [provider.key]: value ? 'saved' : 'idle' }));
      successToast(
        value
          ? t('providerKeySaved', { provider: provider.label })
          : t('providerKeyCleared', { provider: provider.label }),
        { id: `provider-key-${provider.key}` },
      );
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : t('saveFailed');
      setStatuses((current) => ({ ...current, [provider.key]: 'error' }));
      setErrors((current) => ({ ...current, [provider.key]: message }));
      errorToast(t('providerKeySaveFailed', { provider: provider.label }), {
        id: `provider-key-${provider.key}`,
        description: message,
      });
    }
  };

  const handleProviderBlur = (provider: ProviderModelGroup, value: string) => {
    if (!value.trim()) return;
    void saveProviderKey(provider, value.trim());
  };

  const changeProviderKey = (provider: ProviderModelGroup, value: string) => {
    setDrafts((current) => ({ ...current, [provider.key]: value }));
    setStatuses((current) => ({ ...current, [provider.key]: 'idle' }));
    setErrors((current) => ({ ...current, [provider.key]: null }));
  };

  const clearProviderKey = (provider: ProviderModelGroup) => {
    setDrafts((current) => ({ ...current, [provider.key]: '' }));
    setSavedValues((current) => ({ ...current, [provider.key]: '' }));
    setRevealed((current) => ({ ...current, [provider.key]: false }));
    void saveProviderKey(provider, '', true);
  };

  const toggleProviderKey = (provider: ProviderModelGroup) => {
    setRevealed((current) => ({ ...current, [provider.key]: !current[provider.key] }));
  };

  return (
    <Tabs defaultValue={defaultCapability} className="min-w-0 gap-4">
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
                revealed={revealed.google}
                status={statuses.google}
                error={errors.google}
                disabled={disabled}
                onChange={(value) => changeProviderKey(googleVisionProvider, value)}
                onClear={() => clearProviderKey(googleVisionProvider)}
                onBlur={(value) => handleProviderBlur(googleVisionProvider, value)}
                onToggleReveal={() => toggleProviderKey(googleVisionProvider)}
                onOpenModels={() => setSelectedProvider('google')}
                modelCountLabel={modelCountLabel(t, googleVisionProvider.models.length)}
              />
              <ProviderRow
                provider={falVisionProvider}
                configured={settings.falApiKeyConfigured}
                value={drafts.fal}
                revealed={revealed.fal}
                status={statuses.fal}
                error={errors.fal}
                disabled={disabled}
                onChange={(value) => changeProviderKey(falVisionProvider, value)}
                onClear={() => clearProviderKey(falVisionProvider)}
                onBlur={(value) => handleProviderBlur(falVisionProvider, value)}
                onToggleReveal={() => toggleProviderKey(falVisionProvider)}
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
            revealed={revealed.fal}
            status={statuses.fal}
            error={errors.fal}
            disabled={disabled}
            onChange={(value) => changeProviderKey(falVideoProvider, value)}
            onClear={() => clearProviderKey(falVideoProvider)}
            onBlur={(value) => handleProviderBlur(falVideoProvider, value)}
            onToggleReveal={() => toggleProviderKey(falVideoProvider)}
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
  revealed,
  status,
  error,
  disabled,
  onChange,
  onClear,
  onBlur,
  onToggleReveal,
  onOpenModels,
  modelCountLabel,
}: {
  provider: ProviderModelGroup;
  configured: boolean;
  value: string;
  revealed: boolean;
  status: SaveStatus;
  error: string | null;
  disabled: boolean;
  onChange: (value: string) => void;
  onClear: () => void;
  onBlur: (value: string) => void;
  onToggleReveal: () => void;
  onOpenModels: () => void;
  modelCountLabel: string;
}) {
  const { t } = useTranslation('settings');
  const ProviderIcon = provider.icon;
  return (
    <div className="grid gap-1.5 py-1.5 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] sm:items-start sm:gap-4">
      <div className="flex min-w-0 items-start gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
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
            className="mt-0.5 block cursor-pointer text-xs tabular-nums text-muted-foreground/50 underline underline-offset-2 transition-colors hover:text-foreground"
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
        revealed={revealed}
        configured={configured}
        status={status}
        error={error}
        onChange={onChange}
        onClear={onClear}
        onBlur={onBlur}
        onToggleReveal={onToggleReveal}
        placeholder={t('pasteProviderKey', { provider: provider.label })}
        clearLabel={t('clearProviderApiKey', { provider: provider.label })}
        showLabel={t('showProviderApiKey', { provider: provider.label })}
        hideLabel={t('hideProviderApiKey', { provider: provider.label })}
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
  revealed: boolean;
  status: SaveStatus;
  error: string | null;
  disabled: boolean;
  onChange: (value: string) => void;
  onClear: () => void;
  onBlur: (value: string) => void;
  onToggleReveal: () => void;
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
  revealed,
  configured,
  status,
  error,
  onChange,
  onClear,
  onBlur,
  onToggleReveal,
  placeholder,
  clearLabel,
  showLabel,
  hideLabel,
  disabled,
}: {
  value: string;
  revealed: boolean;
  configured: boolean;
  status: SaveStatus;
  error: string | null;
  onChange: (value: string) => void;
  onClear: () => void;
  onBlur: (value: string) => void;
  onToggleReveal: () => void;
  placeholder: string;
  clearLabel: string;
  showLabel: string;
  hideLabel: string;
  disabled: boolean;
}) {
  const { t } = useTranslation('settings');
  const statusLabel = saveStatusLabel(t, status);
  const savedAndIdle = configured && !value && status === 'idle';

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Blur is observed across the input group so its internal buttons do not trigger a save.
    <div
      className="min-w-0 space-y-1.5"
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        onBlur(value);
      }}
    >
      <InputGroup data-disabled={disabled || undefined}>
        <InputGroupInput
          type={revealed ? 'text' : 'password'}
          autoComplete="off"
          spellCheck={false}
          data-1p-ignore=""
          data-lpignore="true"
          data-form-type="other"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              event.currentTarget.blur();
            }
          }}
          placeholder={configured ? t('savedKeyReplace') : placeholder}
          disabled={disabled}
          aria-invalid={status === 'error'}
        />
        <InputGroupAddon align="inline-end" className="gap-1">
          {status !== 'idle' ? (
            <KeyStatusGlyph status={status} label={statusLabel} />
          ) : savedAndIdle ? (
            <>
              <span
                role="status"
                title={t('saved')}
                aria-label={t('saved')}
                className="flex shrink-0 items-center"
              >
                <Check weight="fill" className="size-3.5 shrink-0 text-brand-green" />
              </span>
              <InputGroupButton
                size="icon-xs"
                onClick={onClear}
                title={clearLabel}
                aria-label={clearLabel}
                className="text-muted-foreground/60 hover:text-destructive"
                disabled={disabled}
              >
                <Remove className="size-3.5" />
              </InputGroupButton>
            </>
          ) : null}
          {value ? (
            <InputGroupButton
              size="icon-xs"
              onClick={onToggleReveal}
              title={revealed ? hideLabel : showLabel}
              aria-label={revealed ? hideLabel : showLabel}
              aria-pressed={revealed}
              className="text-muted-foreground/60 hover:text-foreground"
              disabled={disabled}
            >
              {revealed ? <EyeSlash className="size-3.5" /> : <Eye className="size-3.5" />}
            </InputGroupButton>
          ) : null}
        </InputGroupAddon>
      </InputGroup>
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function KeyStatusGlyph({ status, label }: { status: SaveStatus; label: string }) {
  if (status === 'idle') return null;
  return (
    <span role="status" title={label} aria-label={label} className="flex shrink-0 items-center">
      {status === 'saving' ? <Loading className="size-3.5 shrink-0" /> : null}
      {status === 'saved' ? (
        <Check weight="fill" className="size-3.5 shrink-0 text-brand-green" />
      ) : null}
      {status === 'error' ? (
        <Warning weight="fill" className="size-3.5 shrink-0 text-brand-red" />
      ) : null}
    </span>
  );
}

function saveStatusLabel(t: ReturnType<typeof useTranslation>['t'], status: SaveStatus) {
  return status === 'saving' ? t('saving') : status === 'error' ? t('saveFailed') : t('saved');
}

function modelCountLabel(t: ReturnType<typeof useTranslation>['t'], count: number) {
  return count === 1 ? t('modelCount', { count }) : t('modelsCount', { count });
}
