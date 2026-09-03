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
import { platformLabel } from './live-output-types';

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
          <DialogTitle>Run live output</DialogTitle>
          <DialogDescription>Choose a destination for this world stream.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="live-output-mode">Output mode</FieldLabel>
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
                  <SelectItem value="rtmp">RTMP destination</SelectItem>
                  <SelectItem value="webrtc">Browser preview</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="live-platform">Platform</FieldLabel>
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
                  <SelectItem value="youtube">{platformLabel('youtube')}</SelectItem>
                  <SelectItem value="twitch">{platformLabel('twitch')}</SelectItem>
                  <SelectItem value="custom">{platformLabel('custom')}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="live-title">Stream title</FieldLabel>
              <Input
                id="live-title"
                value={settings.title}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="A title for this live output"
              />
            </Field>
            {settings.mode === 'rtmp' ? (
              <Field>
                <FieldLabel htmlFor="live-endpoint">RTMP endpoint</FieldLabel>
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
                <FieldLabel htmlFor="live-stream-key">Stream key</FieldLabel>
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
                      ? 'Saved Twitch key'
                      : 'Paste the destination stream key'
                  }
                />
                <FieldDescription>
                  {settings.platform === 'twitch' && twitchStreamKeyConfigured
                    ? 'The saved local Twitch key will be used when this is blank.'
                    : 'Kept in this session and sent only when the output is started.'}
                </FieldDescription>
              </Field>
            ) : (
              <FieldDescription>
                Generated scenes will be available in this browser while the run is active.
              </FieldDescription>
            )}
          </FieldGroup>
          <DialogFooter className="mt-5 border-t border-border/70 pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default">
              <Radio size={15} aria-hidden="true" /> Run
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
