import { useEffect, useState, type FormEvent } from 'react';
import { Radio } from 'lucide-react';

import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { LiveOutputSettings } from './live-output-types';
import { useTranslation } from '../../i18n/use-translation';

interface LiveRunDialogProps {
  open: boolean;
  initialSettings: LiveOutputSettings;
  twitchStreamKeyConfigured: boolean;
  onOpenChange: (open: boolean) => void;
  onRun: (settings: LiveOutputSettings) => void;
}

export function LiveRunDialog({
  open,
  initialSettings,
  twitchStreamKeyConfigured,
  onOpenChange,
  onRun,
}: LiveRunDialogProps) {
  const { t } = useTranslation();
  const [settings, setSettings] = useState(initialSettings);

  useEffect(() => {
    if (open) setSettings(initialSettings);
  }, [initialSettings, open]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onRun(settings);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('dashboard.runLiveOutput')}</DialogTitle>
          <DialogDescription>{t('dashboard.chooseDestination')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="live-output-mode">{t('dashboard.outputMode')}</FieldLabel>
              <Select
                value={settings.mode}
                onValueChange={(mode) =>
                  setSettings((current) => ({
                    ...current,
                    mode: mode as LiveOutputSettings['mode'],
                  }))
                }
              >
                <SelectTrigger id="live-output-mode" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rtmp">{t('dashboard.rtmpDestination')}</SelectItem>
                  <SelectItem value="webrtc">{t('dashboard.browserPreview')}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="live-platform">{t('dashboard.platform')}</FieldLabel>
              <Select
                value={settings.platform}
                onValueChange={(platform) =>
                  setSettings((current) => ({
                    ...current,
                    platform: platform as LiveOutputSettings['platform'],
                  }))
                }
              >
                <SelectTrigger id="live-platform" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">{t('platform.youtube')}</SelectItem>
                  <SelectItem value="twitch">{t('platform.twitch')}</SelectItem>
                  <SelectItem value="custom">{t('platform.custom')}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="live-title">{t('dashboard.streamTitle')}</FieldLabel>
              <Input
                id="live-title"
                value={settings.title}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, title: event.target.value }))
                }
                placeholder={t('dashboard.streamTitlePlaceholder')}
              />
            </Field>
            {settings.mode === 'rtmp' ? (
              <Field>
                <FieldLabel htmlFor="live-endpoint">{t('dashboard.rtmpEndpoint')}</FieldLabel>
                <Input
                  id="live-endpoint"
                  type="url"
                  required
                  value={settings.endpoint}
                  onChange={(event) =>
                    setSettings((current) => ({ ...current, endpoint: event.target.value }))
                  }
                  placeholder="rtmps://..."
                />
              </Field>
            ) : null}
            {settings.mode === 'rtmp' ? (
              <Field>
                <FieldLabel htmlFor="live-stream-key">{t('dashboard.streamKey')}</FieldLabel>
                <Input
                  id="live-stream-key"
                  type="password"
                  required={settings.platform !== 'twitch' || !twitchStreamKeyConfigured}
                  autoComplete="off"
                  value={settings.streamKey}
                  onChange={(event) =>
                    setSettings((current) => ({ ...current, streamKey: event.target.value }))
                  }
                  placeholder={
                    settings.platform === 'twitch' && twitchStreamKeyConfigured
                      ? t('dashboard.savedTwitchKey')
                      : t('dashboard.destinationStreamKey')
                  }
                />
                <FieldDescription>
                  {settings.platform === 'twitch' && twitchStreamKeyConfigured
                    ? t('dashboard.savedTwitchKeyWillBeUsed')
                    : t('dashboard.sessionOnlyKey')}
                </FieldDescription>
              </Field>
            ) : (
              <FieldDescription>{t('dashboard.generatedScenesBrowser')}</FieldDescription>
            )}
          </FieldGroup>
          <DialogFooter className="mt-5 border-t border-border/70 pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="default">
              <Radio size={15} aria-hidden="true" /> {t('common.run')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
