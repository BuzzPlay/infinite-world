import { History } from 'lucide-react';
import type { GenerationHistorySnapshot } from '@infinite-world/api-contract';

import { Empty, EmptyDescription, EmptyMedia } from '../ui/empty';
import { Item, ItemContent, ItemDescription, ItemTitle } from '../ui/item';
import { SectionCard } from '../ui/section-card';

export function GenerationHistory({ records }: { records: GenerationHistorySnapshot[] }) {
  return (
    <SectionCard title="Generation history" description="Effective settings used by recent scenes" flush>
      <div className="px-2 py-1">
        {records.length ? [...records].reverse().slice(0, 5).map((record) => (
          <Item className="mx-1 rounded-md border-x-0 border-t-0 border-border/70 px-2.5 py-2 last:border-b-0" size="sm" key={`${record.generationId}-${record.timestamp}`}>
            <ItemContent className="gap-0.5">
              <ItemTitle className="text-xs">Generation {String(record.generationId).padStart(2, '0')}</ItemTitle>
              <ItemDescription className="line-clamp-2 text-xs">{record.prompt || 'No prompt recorded'}</ItemDescription>
              <span className="text-[11px] text-muted-foreground">
                {record.model} · {record.mode} · {record.durationSeconds}s · {record.frameRate} fps · {record.numFrames} frames
              </span>
              <span className="text-[11px] text-muted-foreground">
                {record.width} x {record.height}{record.resolution ? ` · ${record.resolution}` : ''}{record.aspectRatio ? ` · ${record.aspectRatio}` : ''}
                {record.initialImageUrl ? ' · initial image' : ''}{record.characterRefs.length ? ` · ${record.characterRefs.length} reference${record.characterRefs.length === 1 ? '' : 's'}` : ''}
              </span>
            </ItemContent>
            <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{record.guidanceScale.toFixed(1)}</span>
          </Item>
        )) : <Empty className="gap-2 rounded-none px-4 py-8"><EmptyMedia><History size={17} aria-hidden="true" /></EmptyMedia><EmptyDescription>Generation inputs will be listed as the run progresses</EmptyDescription></Empty>}
      </div>
    </SectionCard>
  );
}
