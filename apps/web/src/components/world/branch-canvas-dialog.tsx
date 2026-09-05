'use client';

import type { SceneSnapshot } from '@infinite-world/api-contract';
import {
  applyNodeChanges,
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  type NodeChange,
  ReactFlow,
} from '@xyflow/react';
import { Film, Trash2 } from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '../ui/context-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface BranchCanvasDialogProps {
  open: boolean;
  scenes: SceneSnapshot[];
  runVersionId: string | null;
  runVersionNumber: number | null;
  selectedVersionId: string | null;
  selectedSceneId: string | null;
  deleting: boolean;
  onOpenChange: (open: boolean) => void;
  onVersionChange: (versionId: string) => void;
  onSelectScene: (sceneId: string) => void;
  onDeleteSceneBranch: (sceneId: string) => Promise<boolean>;
}

type SceneNode = Node<{ label: ReactNode }>;
type SceneVersion = { id: string; number: number };
const CANVAS_LAYOUT_STORAGE_PREFIX = 'infinite-world:branch-canvas-layout:';

export function BranchCanvasDialog({
  open,
  scenes,
  runVersionId,
  runVersionNumber,
  selectedVersionId,
  selectedSceneId,
  deleting,
  onOpenChange,
  onVersionChange,
  onSelectScene,
  onDeleteSceneBranch,
}: BranchCanvasDialogProps) {
  const { t } = useTranslation();
  const [pendingDelete, setPendingDelete] = useState<SceneSnapshot | null>(null);
  const [deletionRequested, setDeletionRequested] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<SceneSnapshot | null>(null);
  const [contextScene, setContextScene] = useState<SceneSnapshot | null>(null);
  const preserveCanvasOpen = useRef(false);
  const nodeClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelPendingNodeClick = useCallback(() => {
    if (nodeClickTimer.current) clearTimeout(nodeClickTimer.current);
    nodeClickTimer.current = null;
  }, []);
  useEffect(() => cancelPendingNodeClick, [cancelPendingNodeClick]);
  const selectSceneFromCanvas = useCallback(
    (sceneId: string) => {
      cancelPendingNodeClick();
      onSelectScene(sceneId);
      nodeClickTimer.current = setTimeout(() => {
        onOpenChange(false);
        nodeClickTimer.current = null;
      }, 450);
    },
    [cancelPendingNodeClick, onOpenChange, onSelectScene],
  );
  const openMediaPreview = useCallback(
    (scene: SceneSnapshot) => {
      cancelPendingNodeClick();
      if (scene.previewUrl.trim()) setMediaPreview(scene);
    },
    [cancelPendingNodeClick],
  );
  const versions = useMemo(
    () => sceneVersions(scenes, runVersionId, runVersionNumber),
    [runVersionId, runVersionNumber, scenes],
  );
  const selectedVersion =
    versions.find((version) => version.id === selectedVersionId) ?? versions[0] ?? null;
  const selectedScenes = useMemo(
    () => scenes.filter((scene) => scene.versionId === selectedVersion?.id),
    [scenes, selectedVersion?.id],
  );
  const visibleSelectedSceneId = selectedScenes.some((scene) => scene.id === selectedSceneId)
    ? selectedSceneId
    : null;
  const graph = useMemo(
    () =>
      sceneGraph(
        selectedScenes,
        visibleSelectedSceneId,
        selectSceneFromCanvas,
        openMediaPreview,
        t,
      ),
    [selectedScenes, visibleSelectedSceneId, selectSceneFromCanvas, openMediaPreview, t],
  );
  const positionsByVersion = useRef(new Map<string, Map<string, SceneNode['position']>>());
  const [canvasNodes, setCanvasNodes] = useState<SceneNode[]>(graph.nodes);
  useEffect(() => {
    let savedPositions: Map<string, SceneNode['position']> | undefined;
    if (selectedVersion) {
      savedPositions =
        positionsByVersion.current.get(selectedVersion.id) ??
        loadCanvasPositions(selectedVersion.id);
      positionsByVersion.current.set(selectedVersion.id, savedPositions);
    }
    setCanvasNodes(
      graph.nodes.map((node) => ({
        ...node,
        position: savedPositions?.get(node.id) ?? node.position,
      })),
    );
  }, [graph, selectedVersion]);
  const updateCanvasNodes = useCallback((changes: NodeChange<SceneNode>[]) => {
    setCanvasNodes((current) => applyNodeChanges(changes, current));
  }, []);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (
          !nextOpen &&
          (contextScene ||
            pendingDelete ||
            mediaPreview ||
            deletionRequested ||
            preserveCanvasOpen.current)
        )
          return;
        if (!nextOpen) cancelPendingNodeClick();
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        className="h-[min(82dvh,820px)] max-w-[calc(100%-2rem)] grid-rows-[auto_minmax(0,1fr)] gap-4 p-4 sm:max-w-6xl sm:p-5"
        onInteractOutside={(event) => {
          if (isBranchCanvasFloatingLayer(event.detail.originalEvent.target)) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader className="pr-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <DialogTitle>{t('dashboard.branchCanvas')}</DialogTitle>
            <DialogDescription>{t('dashboard.branchCanvasDescription')}</DialogDescription>
          </div>
          {selectedVersion ? (
            <Select value={selectedVersion.id} onValueChange={onVersionChange}>
              <SelectTrigger
                variant="outline"
                className="w-full sm:w-36"
                aria-label={t('versions.select')}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {versions.map((version) => (
                  <SelectItem key={version.id} value={version.id}>
                    {t('versions.version', { sequence: version.number })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </DialogHeader>
        <ContextMenu
          open={contextScene !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setContextScene(null);
          }}
        >
          <ContextMenuTrigger asChild>
            <div className="min-h-0 overflow-hidden rounded-lg border bg-background">
              {selectedScenes.length ? (
                <ReactFlow<SceneNode, Edge>
                  nodes={canvasNodes}
                  edges={graph.edges}
                  fitView
                  fitViewOptions={{ padding: 0.24, maxZoom: 1.1 }}
                  minZoom={0.25}
                  maxZoom={1.8}
                  nodesDraggable
                  nodesConnectable={false}
                  elementsSelectable
                  onNodesChange={updateCanvasNodes}
                  onNodeDragStop={(_event, node) => {
                    if (!selectedVersion) return;
                    const savedPositions =
                      positionsByVersion.current.get(selectedVersion.id) ?? new Map();
                    savedPositions.set(node.id, node.position);
                    positionsByVersion.current.set(selectedVersion.id, savedPositions);
                    saveCanvasPositions(selectedVersion.id, savedPositions);
                  }}
                  proOptions={{ hideAttribution: true }}
                  aria-label={t('dashboard.branchCanvas')}
                  onNodeContextMenu={(event, node) => {
                    cancelPendingNodeClick();
                    const scene = selectedScenes.find((candidate) => candidate.id === node.id);
                    if (!scene || scene.versionSceneSequence === 1) {
                      event.preventDefault();
                      setContextScene(null);
                      return;
                    }
                    setContextScene(scene);
                  }}
                  onPaneContextMenu={(event) => {
                    event.preventDefault();
                    setContextScene(null);
                  }}
                >
                  <Background
                    variant={BackgroundVariant.Dots}
                    gap={20}
                    size={1}
                    color="var(--border)"
                  />
                  <MiniMap
                    pannable
                    zoomable
                    nodeColor={(node) => {
                      if (node.id === visibleSelectedSceneId) return 'var(--brand-blue)';
                      return 'var(--muted-foreground)';
                    }}
                    maskColor="color-mix(in oklch, var(--background) 78%, transparent)"
                    className="!border !border-border !bg-card"
                  />
                  <Controls
                    showInteractive={false}
                    className="!overflow-hidden !rounded-md !border !border-border !bg-card !shadow-sm [&>button]:!border-border [&>button]:!bg-card [&>button]:!text-foreground [&>button:hover]:!bg-accent"
                  />
                </ReactFlow>
              ) : (
                <div className="grid size-full place-items-center px-6 text-center text-sm text-muted-foreground">
                  {t('versions.emptyVersion')}
                </div>
              )}
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent
            collisionPadding={8}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <ContextMenuItem
              variant="destructive"
              disabled={deleting}
              onSelect={() => {
                if (contextScene) setPendingDelete(contextScene);
                setContextScene(null);
              }}
            >
              <Trash2 aria-hidden="true" />
              {t('dashboard.deleteScene')}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </DialogContent>
      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dashboard.deleteSceneTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('dashboard.deleteSceneDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting || deletionRequested}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting || deletionRequested || !pendingDelete}
              onClick={(event) => {
                event.preventDefault();
                if (!pendingDelete) return;
                preserveCanvasOpen.current = true;
                setDeletionRequested(true);
                void onDeleteSceneBranch(pendingDelete.id).finally(() => {
                  setPendingDelete(null);
                  setDeletionRequested(false);
                  window.setTimeout(() => {
                    preserveCanvasOpen.current = false;
                  }, 0);
                });
              }}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog
        open={mediaPreview !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setMediaPreview(null);
        }}
      >
        <DialogContent className="max-w-[calc(100%-2rem)] gap-0 overflow-hidden border-white/10 bg-black p-2 text-white sm:max-w-5xl">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {t('dashboard.scene', { sequence: mediaPreview?.versionSceneSequence ?? 0 })}
            </DialogTitle>
            <DialogDescription>{mediaPreview?.contextSummary}</DialogDescription>
          </DialogHeader>
          {mediaPreview ? <SceneMediaPreview scene={mediaPreview} /> : null}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

function sceneGraph(
  scenes: SceneSnapshot[],
  selectedSceneId: string | null,
  onSelectScene: (sceneId: string) => void,
  onOpenMediaPreview: (scene: SceneSnapshot) => void,
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  const sortedScenes = [...scenes].sort((left, right) => left.sequence - right.sequence);
  const sceneById = new Map(sortedScenes.map((scene) => [scene.id, scene]));
  const depthById = new Map<string, number>();

  const getDepth = (scene: SceneSnapshot, path = new Set<string>()): number => {
    const known = depthById.get(scene.id);
    if (known !== undefined) return known;
    if (!scene.parentSceneId || path.has(scene.id)) {
      depthById.set(scene.id, 0);
      return 0;
    }
    const parent = sceneById.get(scene.parentSceneId);
    if (!parent) {
      depthById.set(scene.id, 0);
      return 0;
    }
    const nextPath = new Set(path).add(scene.id);
    const depth = getDepth(parent, nextPath) + 1;
    depthById.set(scene.id, depth);
    return depth;
  };

  const levels = new Map<number, SceneSnapshot[]>();
  for (const scene of sortedScenes) {
    const depth = getDepth(scene);
    levels.set(depth, [...(levels.get(depth) ?? []), scene]);
  }

  const orderedLevels = [...levels.entries()].sort(([left], [right]) => left - right);
  const orderById = new Map<string, number>();
  for (const [depth, level] of orderedLevels) {
    level.sort((left, right) => {
      if (depth === 0) return left.sequence - right.sequence;
      const leftParentOrder = orderById.get(left.parentSceneId ?? '') ?? Number.MAX_SAFE_INTEGER;
      const rightParentOrder = orderById.get(right.parentSceneId ?? '') ?? Number.MAX_SAFE_INTEGER;
      if (leftParentOrder !== rightParentOrder) return leftParentOrder - rightParentOrder;
      const leftParent = left.parentSceneId ? sceneById.get(left.parentSceneId) : null;
      const rightParent = right.parentSceneId ? sceneById.get(right.parentSceneId) : null;
      const leftOptionIndex = leftParent?.options.findIndex(
        (option) => option.id === left.sourceOptionId,
      );
      const rightOptionIndex = rightParent?.options.findIndex(
        (option) => option.id === right.sourceOptionId,
      );
      const normalizedLeftOptionIndex =
        leftOptionIndex === undefined || leftOptionIndex === -1
          ? Number.MAX_SAFE_INTEGER
          : leftOptionIndex;
      const normalizedRightOptionIndex =
        rightOptionIndex === undefined || rightOptionIndex === -1
          ? Number.MAX_SAFE_INTEGER
          : rightOptionIndex;
      if (normalizedLeftOptionIndex !== normalizedRightOptionIndex) {
        return normalizedLeftOptionIndex - normalizedRightOptionIndex;
      }
      return left.sequence - right.sequence;
    });
    level.forEach((scene, index) => {
      orderById.set(scene.id, index);
    });
  }

  const widestLevel = Math.max(1, ...orderedLevels.map(([, level]) => level.length));
  const columnGap = 260;
  const rowGap = 210;
  const nodes: SceneNode[] = [];

  for (const [depth, level] of orderedLevels) {
    const levelWidth = (level.length - 1) * columnGap;
    const canvasWidth = (widestLevel - 1) * columnGap;
    const offset = (canvasWidth - levelWidth) / 2;
    level.forEach((scene, index) => {
      const isSelected = scene.id === selectedSceneId;
      const parent = scene.parentSceneId ? sceneById.get(scene.parentSceneId) : null;
      const sourceOption = parent?.options.find((option) => option.id === scene.sourceOptionId);
      const automaticContinuation = parent?.versionId === scene.versionId;

      nodes.push({
        id: scene.id,
        position: { x: offset + index * columnGap, y: depth * rowGap },
        data: {
          label: (
            <SceneNodeCard
              scene={scene}
              sourceLabel={
                parent
                  ? sourceOption
                    ? `${sourceOption.label} · ${sourceOption.title}`
                    : automaticContinuation
                      ? t('dashboard.automaticContinuation')
                      : null
                  : null
              }
              selected={isSelected}
              onSelectScene={onSelectScene}
              onOpenMediaPreview={onOpenMediaPreview}
              t={t}
            />
          ),
        },
        className: cn(
          '!w-56 !overflow-hidden !rounded-lg !border !bg-card !p-0 !text-card-foreground !shadow-sm transition-[border-color,box-shadow]',
          isSelected && '!border-brand-blue !ring-2 !ring-brand-blue/15',
        ),
        ariaLabel: t('dashboard.scene', { sequence: scene.versionSceneSequence }),
      });
    });
  }

  const edges: Edge[] = sortedScenes.flatMap((scene) => {
    if (!scene.parentSceneId || !sceneById.has(scene.parentSceneId)) return [];
    const parent = sceneById.get(scene.parentSceneId);
    if (parent?.versionId !== scene.versionId && !scene.sourceOptionId) return [];
    return [
      {
        id: `${scene.parentSceneId}-${scene.id}`,
        source: scene.parentSceneId,
        target: scene.id,
        type: 'smoothstep',
        style: {
          stroke: scene.id === selectedSceneId ? 'var(--brand-blue)' : 'var(--muted-foreground)',
          strokeWidth: scene.id === selectedSceneId ? 2 : 1.25,
        },
      },
    ];
  });

  return { nodes, edges };
}

function SceneNodeCard({
  scene,
  sourceLabel,
  selected,
  onSelectScene,
  onOpenMediaPreview,
  t,
}: {
  scene: SceneSnapshot;
  sourceLabel: string | null;
  selected: boolean;
  onSelectScene: (sceneId: string) => void;
  onOpenMediaPreview: (scene: SceneSnapshot) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <button
      type="button"
      className="block w-full text-left"
      onClick={(event) => {
        if (event.detail > 1) {
          onOpenMediaPreview(scene);
          return;
        }
        onSelectScene(scene.id);
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
      }}
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        <SceneNodeMedia scene={scene} />
        <SceneNodeStatus selected={selected} t={t} />
      </div>
      <div className="space-y-1.5 p-3">
        <span className="text-xs font-medium">
          {t('dashboard.scene', { sequence: scene.versionSceneSequence })}
        </span>
        {sourceLabel ? (
          <p className="truncate text-[11px] text-muted-foreground" title={sourceLabel}>
            {sourceLabel}
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground">{t('dashboard.versionStart')}</p>
        )}
      </div>
    </button>
  );
}

function SceneNodeMedia({ scene }: { scene: SceneSnapshot }) {
  if (scene.mediaType === 'video' && scene.previewUrl) {
    return (
      <video
        className="size-full object-cover"
        src={scene.previewUrl}
        muted
        playsInline
        preload="metadata"
      />
    );
  }
  if (scene.mediaType === 'image' && scene.previewUrl) {
    // biome-ignore lint/performance/noImgElement: Generated media can use arbitrary provider URLs.
    return <img className="size-full object-cover" src={scene.previewUrl} alt="" />;
  }
  return (
    <div className="grid size-full place-items-center text-muted-foreground">
      <Film className="size-5" aria-hidden="true" />
    </div>
  );
}

function SceneMediaPreview({ scene }: { scene: SceneSnapshot }) {
  if (scene.mediaType === 'video') {
    return (
      // biome-ignore lint/a11y/useMediaCaption: Generated video providers do not supply caption tracks.
      <video
        className="max-h-[82dvh] w-full rounded-md bg-black object-contain"
        src={scene.previewUrl}
        controls
        autoPlay
        playsInline
      />
    );
  }
  return (
    // biome-ignore lint/performance/noImgElement: Generated media can use arbitrary provider URLs.
    <img
      className="max-h-[82dvh] w-full rounded-md bg-black object-contain"
      src={scene.previewUrl}
      alt={scene.contextSummary}
    />
  );
}

function SceneNodeStatus({ selected, t }: { selected: boolean; t: (key: string) => string }) {
  if (!selected) return null;
  return (
    <div className="absolute left-2 top-2 flex flex-wrap gap-1">
      <span className="rounded-sm bg-brand-blue px-1.5 py-0.5 text-[10px] font-medium text-white shadow-xs">
        {t('dashboard.currentScene')}
      </span>
    </div>
  );
}

function sceneVersions(
  scenes: SceneSnapshot[],
  runVersionId: string | null,
  runVersionNumber: number | null,
): SceneVersion[] {
  const versions = new Map<string, SceneVersion>();
  for (const scene of scenes) {
    versions.set(scene.versionId, { id: scene.versionId, number: scene.version });
  }
  if (runVersionId && runVersionNumber !== null) {
    versions.set(runVersionId, { id: runVersionId, number: runVersionNumber });
  }
  return [...versions.values()].sort((left, right) => right.number - left.number);
}

function isBranchCanvasFloatingLayer(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        '[data-slot="context-menu-content"], [data-slot="alert-dialog-content"], [data-slot="alert-dialog-overlay"]',
      ),
    )
  );
}

function loadCanvasPositions(versionId: string) {
  const positions = new Map<string, SceneNode['position']>();
  try {
    const stored = window.localStorage.getItem(`${CANVAS_LAYOUT_STORAGE_PREFIX}${versionId}`);
    if (!stored) return positions;
    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return positions;
    for (const [nodeId, position] of Object.entries(parsed)) {
      if (
        position &&
        typeof position === 'object' &&
        'x' in position &&
        'y' in position &&
        typeof position.x === 'number' &&
        typeof position.y === 'number' &&
        Number.isFinite(position.x) &&
        Number.isFinite(position.y)
      ) {
        positions.set(nodeId, { x: position.x, y: position.y });
      }
    }
  } catch {
    return positions;
  }
  return positions;
}

function saveCanvasPositions(versionId: string, positions: Map<string, SceneNode['position']>) {
  try {
    window.localStorage.setItem(
      `${CANVAS_LAYOUT_STORAGE_PREFIX}${versionId}`,
      JSON.stringify(Object.fromEntries(positions)),
    );
  } catch {
    // Canvas layout is a local preference; dragging should still work when storage is unavailable.
  }
}
