import { Copy, Clapperboard } from 'lucide-react';
import type { SceneSnapshot } from '@infinite-world/api-contract';

import { Button } from '../ui/button';
import { Empty, EmptyDescription, EmptyMedia } from '../ui/empty';
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '../ui/item';
import { SectionCard } from '../ui/section-card';
import { useTranslation } from '../../i18n/use-translation';

export function SceneHistory({
  scenes,
  currentScene,
  onCopy,
}: {
  scenes: SceneSnapshot[];
  currentScene: SceneSnapshot | null;
  onCopy: () => void;
}) {
  const { t } = useTranslation();

  return (
    <SectionCard
      title={t('history.recentScenes')}
      description={t('history.sceneCount', { count: scenes.length })}
      action={
        <Button
          size="icon"
          variant="ghost"
          type="button"
          title={t('history.copySceneContext')}
          aria-label={t('history.copySceneContext')}
          onClick={onCopy}
        >
          <Copy size={15} aria-hidden="true" />
        </Button>
      }
      flush
    >
      <div className="px-2 py-1">
        {scenes.length ? (
          [...scenes]
            .reverse()
            .slice(0, 5)
            .map((scene) => (
              <Item
                className={`mx-1 rounded-md border-x-0 border-t-0 border-border/70 px-2.5 py-2 last:border-b-0 ${scene.id === currentScene?.id ? 'bg-muted' : ''}`}
                size="sm"
                key={scene.id}
              >
                <ItemMedia
                  variant="image"
                  className="size-12 rounded-sm outline outline-1 -outline-offset-1 outline-foreground/10"
                >
                  {scene.mediaType === 'video' ? (
                    <video
                      className="size-full object-cover"
                      src={scene.previewUrl}
                      muted
                      playsInline
                      preload="metadata"
                      aria-hidden="true"
                    />
                  ) : scene.mediaType === 'image' && scene.previewUrl ? (
                    <img className="size-full object-cover" src={scene.previewUrl} alt="" />
                  ) : (
                    <span className="grid size-full place-items-center bg-muted text-[10px] text-muted-foreground">
                      {t('history.noMedia')}
                    </span>
                  )}
                </ItemMedia>
                <ItemContent className="gap-0.5">
                  <ItemTitle className="text-xs">
                    {t('history.scene', {
                      sequence: String(scene.sequence).padStart(2, '0'),
                    })}
                  </ItemTitle>
                  <ItemDescription className="line-clamp-1 truncate text-xs">
                    {scene.contextSummary}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <time className="text-[11px] tabular-nums text-muted-foreground">
                    {scene.generationLatencyMs} ms
                  </time>
                </ItemActions>
              </Item>
            ))
        ) : (
          <Empty className="gap-2 rounded-none px-4 py-8">
            <EmptyMedia>
              <Clapperboard size={17} aria-hidden="true" />
            </EmptyMedia>
            <EmptyDescription>{t('history.scenesProgress')}</EmptyDescription>
          </Empty>
        )}
      </div>
    </SectionCard>
  );
}
