import { History } from 'lucide-react';
import { useTranslation } from '../../i18n/use-translation';
import { Button } from '../ui/button';
import type { SceneVersionSummary } from './scene-version-data';

interface RecentVersionsPanelProps {
  versions: SceneVersionSummary[];
  onSelectVersion: (sceneId: string) => void;
}

export function RecentVersionsPanel({ versions, onSelectVersion }: RecentVersionsPanelProps) {
  const { t } = useTranslation();
  if (!versions.length) return null;

  return (
    <section
      className="w-fit max-w-full text-foreground"
      aria-label={t('dashboard.recentVersions')}
    >
      <div className="mb-2 flex items-center gap-2 px-1 text-xs font-medium text-muted-foreground">
        <History className="size-3.5" aria-hidden="true" />
        <span>{t('dashboard.recentVersions')}</span>
      </div>
      <div className="flex w-fit max-w-[min(34rem,calc(100vw-3rem))] flex-wrap gap-2 pb-1">
        {versions.slice(0, 6).map((version) => (
          <Button
            key={version.id}
            type="button"
            variant="transparent"
            className="h-auto w-44 min-w-0 justify-start gap-2.5 rounded-lg border border-border/70 bg-card p-2 text-left hover:border-ring/50 hover:bg-accent"
            onClick={() => onSelectVersion(version.latestScene.id)}
          >
            <span className="grid aspect-video w-16 shrink-0 place-items-center overflow-hidden rounded-md border border-border/60 bg-muted text-muted-foreground">
              {version.firstScene.previewUrl && version.firstScene.mediaType === 'video' ? (
                <video
                  className="size-full object-cover"
                  src={version.firstScene.previewUrl}
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : version.firstScene.previewUrl && version.firstScene.mediaType === 'image' ? (
                // biome-ignore lint/performance/noImgElement: Generated media can use arbitrary provider URLs.
                <img
                  className="size-full object-cover"
                  src={version.firstScene.previewUrl}
                  alt=""
                />
              ) : (
                <History className="size-4" aria-hidden="true" />
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-medium">
                {t('versions.version', { sequence: version.number })}
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {t('versions.sceneCount', { count: version.sceneCount })}
              </span>
            </span>
          </Button>
        ))}
      </div>
    </section>
  );
}
