import { Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '../../i18n/use-translation';
import {
  PROJECT_ICON_COLORS,
  PROJECT_ICON_OPTIONS,
  ProjectIcon,
  type ProjectIconColor,
  projectIconParts,
  projectIconToken,
} from '../projects/project-icon';
import { Button } from '../ui/button';
import { EmojiPicker } from '../ui/emoji-picker';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface CustomizePanelProps {
  name: string;
  icon?: string;
  busy: boolean;
  onSaveName: (name: string) => Promise<boolean>;
  onIconChange: (icon: string | undefined) => void;
  onRequestDelete: () => void;
}

const COLOR_SWATCHES: Record<ProjectIconColor, string> = {
  slate: 'bg-slate-300',
  red: 'bg-red-300',
  orange: 'bg-orange-300',
  amber: 'bg-amber-300',
  green: 'bg-green-300',
  blue: 'bg-blue-300',
  purple: 'bg-purple-300',
  pink: 'bg-pink-300',
};

export function CustomizePanel({
  name,
  icon,
  busy,
  onSaveName,
  onIconChange,
  onRequestDelete,
}: CustomizePanelProps) {
  const { t } = useTranslation();
  const [draftName, setDraftName] = useState(name);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [iconTab, setIconTab] = useState<'emoji' | 'icon'>('emoji');
  const [iconSearch, setIconSearch] = useState('');
  const [iconColor, setIconColor] = useState<ProjectIconColor>(
    projectIconParts(icon)?.color.name ?? 'slate',
  );

  useEffect(() => setDraftName(name), [name]);

  const filteredIcons = useMemo(() => {
    const query = iconSearch.trim().toLowerCase();
    if (!query) return PROJECT_ICON_OPTIONS;
    return PROJECT_ICON_OPTIONS.filter((option) => option.label.toLowerCase().includes(query));
  }, [iconSearch]);

  const saveName = async () => {
    const nextName = draftName.trim();
    if (!nextName || nextName === name || busy) return;
    await onSaveName(nextName);
  };

  return (
    <main className="h-full overflow-y-auto bg-background px-4 pb-10 pt-20 sm:px-6 sm:pt-20 lg:px-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <h1 className="text-xl font-semibold tracking-tight">{t('common.general')}</h1>

        <section className="overflow-hidden rounded-lg border border-border bg-background">
          <div className="flex items-center justify-between gap-6 border-b border-border px-4 py-4 sm:px-5">
            <div className="min-w-0">
              <h2 className="text-sm font-medium">{t('project.icon')}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t('project.iconDescription')}</p>
            </div>
            <Popover open={iconPickerOpen} onOpenChange={setIconPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-base"
                  className="overflow-hidden text-xl"
                  aria-label={t('project.changeIcon')}
                >
                  {icon?.startsWith('icon:') ? (
                    <ProjectIcon value={icon} size={20} />
                  ) : icon && !icon.startsWith('data:image/') ? (
                    icon
                  ) : (
                    '✨'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-[calc(75*var(--spacing)+2px)] overflow-hidden p-0"
              >
                <div className="grid grid-cols-2 border-b border-border p-1">
                  {(['emoji', 'icon'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      className={cn(
                        'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        iconTab === tab
                          ? 'bg-muted text-foreground'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                      onClick={() => setIconTab(tab)}
                    >
                      {tab === 'emoji' ? t('project.emoji') : t('project.iconTab')}
                    </button>
                  ))}
                </div>
                {iconTab === 'emoji' ? (
                  <EmojiPicker
                    onEmojiSelect={(selection) => {
                      onIconChange(selection.emoji);
                      setIconPickerOpen(false);
                    }}
                  />
                ) : (
                  <div>
                    <div className="grid gap-3 border-b border-border p-3">
                      <div className="relative">
                        <Search
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <Input
                          value={iconSearch}
                          onChange={(event) => setIconSearch(event.target.value)}
                          placeholder={t('project.searchIcons')}
                          className="h-9 pl-9"
                          aria-label={t('project.searchIcons')}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        {PROJECT_ICON_COLORS.map((color) => (
                          <button
                            key={color.name}
                            type="button"
                            className={cn(
                              'size-7 rounded-full border border-border/70 p-0.5',
                              iconColor === color.name && 'ring-2 ring-ring ring-offset-1',
                            )}
                            onClick={() => {
                              setIconColor(color.name);
                              const current = projectIconParts(icon);
                              if (current)
                                onIconChange(projectIconToken(current.option.name, color.name));
                            }}
                            aria-label={color.name}
                          >
                            <span
                              className={cn(
                                'block size-full rounded-full',
                                COLOR_SWATCHES[color.name],
                              )}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid max-h-64 grid-cols-8 gap-1 overflow-y-auto p-3">
                      {filteredIcons.map((option) => {
                        const Icon = option.icon;
                        return (
                          <Button
                            key={option.name}
                            type="button"
                            variant="ghost"
                            size="icon-base"
                            title={option.label}
                            aria-label={option.label}
                            onClick={() => {
                              onIconChange(projectIconToken(option.name, iconColor));
                              setIconPickerOpen(false);
                            }}
                          >
                            <Icon size={18} aria-hidden="true" />
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="border-t border-border p-1">
                  {icon ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full justify-start gap-2 px-3 text-destructive hover:text-destructive"
                      title={t('project.resetIcon')}
                      onClick={() => {
                        onIconChange(undefined);
                        setIconPickerOpen(false);
                      }}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                      {t('project.resetIcon')}
                    </Button>
                  ) : null}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <h2 className="text-sm font-medium">{t('project.name')}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t('project.nameDescription')}</p>
            </div>
            <Input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              onBlur={() => void saveName()}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.currentTarget.blur();
                }
              }}
              disabled={busy}
              className="sm:max-w-sm"
              aria-label={t('project.name')}
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-destructive/30 bg-background">
          <div className="border-b border-destructive/20 px-4 py-4 sm:px-5">
            <h2 className="text-sm font-medium">{t('project.dangerZone')}</h2>
          </div>
          <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <h2 className="text-sm font-medium">{t('project.deleteProject')}</h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                {t('project.deleteDescription', { name })}
              </p>
            </div>
            <Button type="button" variant="destructive" onClick={onRequestDelete} disabled={busy}>
              <Trash2 size={15} aria-hidden="true" />
              {t('project.deleteProject')}
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
