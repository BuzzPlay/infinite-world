'use client';

import type { RunVersionSnapshot, SceneSnapshot } from '@infinite-world/api-contract';
import { Clapperboard, History, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '../../i18n/use-translation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Empty, EmptyDescription, EmptyMedia } from '../ui/empty';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { type SceneVersionSummary, sceneVersionSummaries } from './scene-version-data';

interface SceneVersionsSheetProps {
  open: boolean;
  scenes: SceneSnapshot[];
  versions: RunVersionSnapshot[];
  runVersionId: string | null;
  selectedSceneId: string | null;
  active: boolean;
  deleting: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectVersion: (sceneId: string) => void;
  onDeleteVersion: (versionId: string) => Promise<boolean>;
}

export function SceneVersionsSheet({
  open,
  scenes,
  versions: versionMetadata,
  runVersionId,
  selectedSceneId,
  active,
  deleting,
  onOpenChange,
  onSelectVersion,
  onDeleteVersion,
}: SceneVersionsSheetProps) {
  const { locale, t } = useTranslation();
  const [pendingDelete, setPendingDelete] = useState<SceneVersionSummary | null>(null);
  const versions = sceneVersionSummaries(scenes, versionMetadata);
  const selectedVersionId =
    scenes.find((scene) => scene.id === selectedSceneId)?.versionId ??
    (versions.some((version) => version.id === runVersionId) ? runVersionId : versions[0]?.id) ??
    null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border/60 px-5 py-4 pr-14">
          <SheetTitle>{t('versions.title')}</SheetTitle>
          <SheetDescription>
            {active ? t('versions.activeDescription') : t('versions.description')}
          </SheetDescription>
        </SheetHeader>
        <SheetBody className="gap-1 p-2">
          {versions.length ? (
            versions.map((version) => {
              const isSelected = version.id === selectedVersionId;
              const canDelete = !active && !isSelected;
              const scene = version.firstScene;
              return (
                <div
                  className={cn(
                    'group/version flex w-full items-center gap-1 rounded-lg border p-1 transition-colors',
                    isSelected
                      ? 'border-border/70 bg-background/70'
                      : 'border-transparent hover:border-border/50 hover:bg-background/40',
                  )}
                  key={version.id}
                >
                  <Button
                    type="button"
                    variant="transparent"
                    className="h-auto min-w-0 flex-1 shrink justify-start gap-3 whitespace-normal p-1.5 text-left"
                    aria-pressed={isSelected}
                    onClick={() => {
                      onSelectVersion(version.latestScene.id);
                      onOpenChange(false);
                    }}
                  >
                    <span className="grid aspect-video w-24 shrink-0 place-items-center overflow-hidden rounded-md border border-border/60 bg-muted text-muted-foreground">
                      {scene.mediaType === 'video' && scene.previewUrl ? (
                        <video
                          className="size-full object-cover"
                          src={scene.previewUrl}
                          muted
                          playsInline
                          preload="metadata"
                          aria-label={t('versions.versionPreview', {
                            sequence: version.number,
                          })}
                        />
                      ) : scene.mediaType === 'image' && scene.previewUrl ? (
                        // biome-ignore lint/performance/noImgElement: Generated media can use arbitrary provider URLs.
                        <img className="size-full object-cover" src={scene.previewUrl} alt="" />
                      ) : (
                        <Clapperboard className="size-4" aria-hidden="true" />
                      )}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-sm font-medium">
                          {t('versions.version', { sequence: version.number })}
                        </span>
                        {isSelected ? (
                          <Badge variant="secondary">{t('versions.current')}</Badge>
                        ) : null}
                      </span>
                      <span className="line-clamp-2 text-xs leading-normal text-muted-foreground">
                        {scene.contextSummary || scene.prompt}
                      </span>
                      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
                        <time>{formatVersionTime(scene.generatedAt, locale)}</time>
                        <span aria-hidden="true">·</span>
                        <span>{t('versions.sceneCount', { count: version.sceneCount })}</span>
                      </span>
                    </span>
                  </Button>
                  {!isSelected ? (
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      className="opacity-0 transition-opacity group-focus-within/version:opacity-100 group-hover/version:opacity-100"
                      disabled={!canDelete || deleting}
                      title={active ? t('versions.stopBeforeDelete') : t('versions.deleteVersion')}
                      aria-label={t('versions.deleteVersionLabel', {
                        sequence: version.number,
                      })}
                      onClick={() => setPendingDelete(version)}
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              );
            })
          ) : (
            <Empty className="min-h-64 gap-3 border-0 px-6 py-12">
              <EmptyMedia variant="icon">
                <History aria-hidden="true" />
              </EmptyMedia>
              <EmptyDescription>{t('versions.empty')}</EmptyDescription>
            </Empty>
          )}
        </SheetBody>

        <AlertDialog
          open={pendingDelete !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setPendingDelete(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('versions.deleteTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('versions.deleteDescription', {
                  sequence: pendingDelete?.number ?? 0,
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={deleting || !pendingDelete}
                onClick={() => {
                  if (pendingDelete) void onDeleteVersion(pendingDelete.id);
                  setPendingDelete(null);
                }}
              >
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}

function formatVersionTime(value: string, locale: string) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return value;
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp);
}
