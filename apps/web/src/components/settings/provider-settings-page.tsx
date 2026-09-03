import { useEffect, useState, type FormEvent } from 'react';
import { Check, KeyRound, Save, Settings2, Trash2 } from 'lucide-react';
import type { ProviderSettings, StylePreset, UpdateProviderSettingsRequest } from '@infinite-world/api-contract';

import { Button } from '../ui/button';
import { FieldDescription } from '../ui/field';
import { Input } from '../ui/input';
import { SectionCard } from '../ui/section-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { SettingsRow, SettingsRowGroup } from '../ui/settings-row';
import { StatusBadge } from '../ui/status';
import { generationModelOptions } from '../world/world-setup-form';

interface ProviderSettingsPageProps {
  settings: ProviderSettings;
  loading: boolean;
  busy: boolean;
  onSave: (settings: UpdateProviderSettingsRequest) => Promise<void>;
}

export function ProviderSettingsPage({ settings, loading, busy, onSave }: ProviderSettingsPageProps) {
  const [falApiKey, setFalApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [groqApiKey, setGroqApiKey] = useState('');
  const [clearFalApiKey, setClearFalApiKey] = useState(false);
  const [clearOpenaiApiKey, setClearOpenaiApiKey] = useState(false);
  const [clearGroqApiKey, setClearGroqApiKey] = useState(false);
  const [defaultModel, setDefaultModel] = useState(settings.defaultModel);
  const [llmTextModel, setLlmTextModel] = useState(settings.llmTextModel);
  const [llmVisionModel, setLlmVisionModel] = useState(settings.llmVisionModel);
  const [llmTemperature, setLlmTemperature] = useState(settings.llmTemperature);
  const [defaultStylePreset, setDefaultStylePreset] = useState<StylePreset>(settings.defaultStylePreset);
  const [twitchChannel, setTwitchChannel] = useState(settings.twitchChannel);
  const [twitchUsername, setTwitchUsername] = useState(settings.twitchUsername);
  const [chatLookback, setChatLookback] = useState(settings.chatLookback);
  const [twitchStreamKey, setTwitchStreamKey] = useState('');
  const [twitchOauthToken, setTwitchOauthToken] = useState('');
  const [clearTwitchStreamKey, setClearTwitchStreamKey] = useState(false);
  const [clearTwitchOauthToken, setClearTwitchOauthToken] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDefaultModel(settings.defaultModel);
    setLlmTextModel(settings.llmTextModel);
    setLlmVisionModel(settings.llmVisionModel);
    setLlmTemperature(settings.llmTemperature);
    setDefaultStylePreset(settings.defaultStylePreset);
    setTwitchChannel(settings.twitchChannel);
    setTwitchUsername(settings.twitchUsername);
    setChatLookback(settings.chatLookback);
    setClearFalApiKey(false);
    setClearOpenaiApiKey(false);
    setClearGroqApiKey(false);
    setClearTwitchStreamKey(false);
    setClearTwitchOauthToken(false);
  }, [settings]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaved(false);
    setError(null);
    try {
      await onSave({
        defaultModel,
        llmTextModel,
        llmVisionModel,
        llmTemperature,
        defaultStylePreset,
        twitchChannel,
        twitchUsername,
        chatLookback,
        ...(falApiKey.trim() ? { falApiKey: falApiKey.trim() } : clearFalApiKey ? { falApiKey: '' } : {}),
        ...(openaiApiKey.trim() ? { openaiApiKey: openaiApiKey.trim() } : clearOpenaiApiKey ? { openaiApiKey: '' } : {}),
        ...(groqApiKey.trim() ? { groqApiKey: groqApiKey.trim() } : clearGroqApiKey ? { groqApiKey: '' } : {}),
        ...(twitchStreamKey.trim() ? { twitchStreamKey: twitchStreamKey.trim() } : clearTwitchStreamKey ? { twitchStreamKey: '' } : {}),
        ...(twitchOauthToken.trim() ? { twitchOauthToken: twitchOauthToken.trim() } : clearTwitchOauthToken ? { twitchOauthToken: '' } : {}),
      });
      setFalApiKey('');
      setOpenaiApiKey('');
      setGroqApiKey('');
      setTwitchStreamKey('');
      setTwitchOauthToken('');
      setClearFalApiKey(false);
      setClearOpenaiApiKey(false);
      setClearGroqApiKey(false);
      setClearTwitchStreamKey(false);
      setClearTwitchOauthToken(false);
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Settings could not be saved');
    }
  };

  return (
    <div className="flex min-h-full min-w-0 bg-background">
      <aside className="hidden w-52 shrink-0 border-r border-border/70 p-4 sm:block">
        <nav aria-label="Settings sections">
          <Button type="button" variant="ghost" className="w-full justify-start gap-2 bg-accent font-medium text-accent-foreground hover:bg-accent hover:text-accent-foreground">
            <Settings2 className="size-4" aria-hidden="true" />
            General
          </Button>
        </nav>
      </aside>
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="w-full max-w-4xl p-5 pb-12 sm:p-10 lg:p-14">
          <h1 className="mb-8 text-2xl font-semibold tracking-tight text-foreground">General</h1>
          <form className="grid gap-4" onSubmit={(event) => void submit(event)}>
            <SectionCard title="Provider settings" description="Credentials and defaults for new projects" flush>
              <SettingsRowGroup className="rounded-none border-x-0 border-b-0">
                <SettingsRow label="FAL API key" description={settings.falApiKeyConfigured ? 'Saved in the local service. Leave blank to keep it.' : 'Used for hosted generation.'} htmlFor="fal-api-key">
                  <div className="flex w-[min(20rem,52vw)] items-center gap-2">
                    <KeyRound className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <Input id="fal-api-key" type="password" autoComplete="new-password" value={falApiKey} onChange={(event) => { setFalApiKey(event.target.value); setClearFalApiKey(false); }} placeholder={settings.falApiKeyConfigured ? 'Saved key' : 'Paste your key'} aria-describedby="fal-api-key-status" />
                    {settings.falApiKeyConfigured || falApiKey ? <Button type="button" size="icon-sm" variant="ghost" title="Clear FAL API key" aria-label="Clear FAL API key" onClick={() => { setFalApiKey(''); setClearFalApiKey(true); }}><Trash2 className="size-3.5" aria-hidden="true" /></Button> : null}
                  </div>
                </SettingsRow>
                <SettingsRow label="Connection" description="Current service status">
                  <StatusBadge id="fal-api-key-status" tone={settings.falApiKeyConfigured ? 'success' : 'neutral'}>
                    {settings.falApiKeyConfigured ? <><Check className="size-3" aria-hidden="true" /> Configured</> : 'Not configured'}
                  </StatusBadge>
                </SettingsRow>
                <SettingsRow label="OpenAI API key" description={settings.openaiApiKeyConfigured ? 'Saved in the local service. Leave blank to keep it.' : 'Optional direct prompt provider key.'} htmlFor="openai-api-key">
                  <div className="flex w-[min(20rem,52vw)] items-center gap-2"><Input id="openai-api-key" className="min-w-0 flex-1" type="password" autoComplete="new-password" value={openaiApiKey} onChange={(event) => { setOpenaiApiKey(event.target.value); setClearOpenaiApiKey(false); }} placeholder={settings.openaiApiKeyConfigured ? 'Saved key' : 'Paste your key'} />{settings.openaiApiKeyConfigured || openaiApiKey ? <Button type="button" size="icon-sm" variant="ghost" title="Clear OpenAI API key" aria-label="Clear OpenAI API key" onClick={() => { setOpenaiApiKey(''); setClearOpenaiApiKey(true); }}><Trash2 className="size-3.5" aria-hidden="true" /></Button> : null}</div>
                </SettingsRow>
                <SettingsRow label="Groq API key" description={settings.groqApiKeyConfigured ? 'Saved in the local service. Leave blank to keep it.' : 'Optional fast prompt provider key.'} htmlFor="groq-api-key">
                  <div className="flex w-[min(20rem,52vw)] items-center gap-2"><Input id="groq-api-key" className="min-w-0 flex-1" type="password" autoComplete="new-password" value={groqApiKey} onChange={(event) => { setGroqApiKey(event.target.value); setClearGroqApiKey(false); }} placeholder={settings.groqApiKeyConfigured ? 'Saved key' : 'Paste your key'} />{settings.groqApiKeyConfigured || groqApiKey ? <Button type="button" size="icon-sm" variant="ghost" title="Clear Groq API key" aria-label="Clear Groq API key" onClick={() => { setGroqApiKey(''); setClearGroqApiKey(true); }}><Trash2 className="size-3.5" aria-hidden="true" /></Button> : null}</div>
                </SettingsRow>
                <SettingsRow label="Default model" description="Selected when creating a project" htmlFor="default-model">
                  <Select value={defaultModel} onValueChange={setDefaultModel} disabled={loading || busy}>
                    <SelectTrigger id="default-model" className="w-[min(20rem,52vw)]" size="sm" aria-label="Default model"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {generationModelOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </SettingsRow>
                <SettingsRow label="Text model" description="Prompt generation model" htmlFor="llm-text-model">
                  <Input id="llm-text-model" className="w-[min(20rem,52vw)]" value={llmTextModel} onChange={(event) => setLlmTextModel(event.target.value)} placeholder="google/gemini-2.5-flash" />
                </SettingsRow>
                <SettingsRow label="Vision model" description="Model used when a frame is available" htmlFor="llm-vision-model">
                  <Input id="llm-vision-model" className="w-[min(20rem,52vw)]" value={llmVisionModel} onChange={(event) => setLlmVisionModel(event.target.value)} placeholder="google/gemini-2.5-flash" />
                </SettingsRow>
                <SettingsRow label="LLM temperature" description="Prompt variation" htmlFor="llm-temperature">
                  <Input id="llm-temperature" className="w-20 px-2 text-right tabular-nums" type="number" min="0" max="2" step="0.05" value={llmTemperature} onChange={(event) => setLlmTemperature(Number(event.target.value))} />
                </SettingsRow>
                <SettingsRow label="Default style" description="Preset for new projects" htmlFor="default-style">
                  <Select value={defaultStylePreset} onValueChange={(value) => setDefaultStylePreset(value as StylePreset)}>
                    <SelectTrigger id="default-style" className="w-44" size="sm" aria-label="Default style"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cohesive">Cohesive</SelectItem>
                      <SelectItem value="chaotic">Chaotic</SelectItem>
                      <SelectItem value="nightmare">Nightmare</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingsRow>
                <SettingsRow label="Chat channel" description={settings.twitchOauthTokenConfigured ? 'Messages can influence the next scene.' : 'Optional Twitch channel input.'} htmlFor="twitch-channel">
                  <Input id="twitch-channel" className="w-[min(20rem,52vw)]" value={twitchChannel} onChange={(event) => setTwitchChannel(event.target.value)} placeholder="channel-name" />
                </SettingsRow>
                <SettingsRow label="Chat username" description="Only needed with an authenticated chat token." htmlFor="twitch-username">
                  <Input id="twitch-username" className="w-[min(20rem,52vw)]" value={twitchUsername} onChange={(event) => setTwitchUsername(event.target.value)} placeholder="bot username" />
                </SettingsRow>
                <SettingsRow label="Chat messages" description="Messages considered for the next scene" htmlFor="chat-lookback">
                  <Input id="chat-lookback" className="w-20 px-2 text-right tabular-nums" type="number" min="1" max="100" step="1" value={chatLookback} onChange={(event) => setChatLookback(Number(event.target.value))} />
                </SettingsRow>
                <SettingsRow label="Twitch stream key" description={settings.twitchStreamKeyConfigured ? 'Saved locally. Leave blank to keep it.' : 'Used when Live starts Twitch output without an explicit key.'} htmlFor="twitch-stream-key">
                  <div className="flex w-[min(20rem,52vw)] items-center gap-2"><Input id="twitch-stream-key" className="min-w-0 flex-1" type="password" autoComplete="new-password" value={twitchStreamKey} onChange={(event) => { setTwitchStreamKey(event.target.value); setClearTwitchStreamKey(false); }} placeholder={settings.twitchStreamKeyConfigured ? 'Saved key' : 'Paste stream key'} />{settings.twitchStreamKeyConfigured || twitchStreamKey ? <Button type="button" size="icon-sm" variant="ghost" title="Clear Twitch stream key" aria-label="Clear Twitch stream key" onClick={() => { setTwitchStreamKey(''); setClearTwitchStreamKey(true); }}><Trash2 className="size-3.5" aria-hidden="true" /></Button> : null}</div>
                </SettingsRow>
                <SettingsRow label="Chat token" description={settings.twitchOauthTokenConfigured ? 'Saved locally. Leave blank to keep it.' : 'Optional OAuth token for the chat listener.'} htmlFor="twitch-token">
                  <div className="flex w-[min(20rem,52vw)] items-center gap-2"><Input id="twitch-token" className="min-w-0 flex-1" type="password" autoComplete="new-password" value={twitchOauthToken} onChange={(event) => { setTwitchOauthToken(event.target.value); setClearTwitchOauthToken(false); }} placeholder={settings.twitchOauthTokenConfigured ? 'Saved token' : 'oauth token'} />{settings.twitchOauthTokenConfigured || twitchOauthToken ? <Button type="button" size="icon-sm" variant="ghost" title="Clear Twitch chat token" aria-label="Clear Twitch chat token" onClick={() => { setTwitchOauthToken(''); setClearTwitchOauthToken(true); }}><Trash2 className="size-3.5" aria-hidden="true" /></Button> : null}</div>
                </SettingsRow>
              </SettingsRowGroup>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 px-4 py-3 sm:px-5">
                <div className="min-w-0">
                  {error ? <FieldDescription className="text-destructive">{error}</FieldDescription> : null}
                  {saved ? <FieldDescription className="flex items-center gap-1 text-brand-green"><Check className="size-3.5" aria-hidden="true" /> Settings saved</FieldDescription> : null}
                </div>
                <Button type="submit" size="sm" variant="default" disabled={loading || busy}>
                  <Save className="size-4" aria-hidden="true" />
                  {busy ? 'Saving' : 'Save settings'}
                </Button>
              </div>
            </SectionCard>
          </form>
        </div>
      </main>
    </div>
  );
}
