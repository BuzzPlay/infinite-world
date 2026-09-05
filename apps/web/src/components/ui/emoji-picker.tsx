'use client';

import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import { EmojiPicker as Frimousse } from 'frimousse';
import { cn } from '@/lib/utils';

export interface EmojiSelection {
  emoji: string;
  label: string;
}

const EMOJI_BUTTON = cn(
  'flex size-8 items-center justify-center rounded-md text-lg leading-none',
  'cursor-pointer select-none transition-[background-color,box-shadow,scale] duration-100',
  'active:scale-[0.96] data-[active]:bg-muted data-[active]:inset-ring-1 data-[active]:inset-ring-border',
);

function rowParity(props: { 'aria-rowindex'?: number }): 'even' | 'odd' {
  return props['aria-rowindex'] && props['aria-rowindex'] % 2 === 1 ? 'odd' : 'even';
}

export function EmojiPicker({ onEmojiSelect }: { onEmojiSelect: (emoji: EmojiSelection) => void }) {
  return (
    <Frimousse.Root
      emojibaseUrl="/emojibase"
      locale="en"
      onEmojiSelect={onEmojiSelect}
      className="isolate flex h-[368px] w-full flex-col"
    >
      <div className="p-1">
        <div className="relative">
          <MagnifyingGlassIcon
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Frimousse.Search
            aria-label="Search emoji"
            placeholder="Search emoji"
            className="h-9 w-full rounded-md border border-border bg-popover pl-9 pr-3 text-sm font-medium outline-none placeholder:text-muted-foreground/60 focus:border-ring"
          />
        </div>
      </div>
      <Frimousse.Viewport className="relative flex-1 overflow-y-auto outline-none">
        <Frimousse.Loading className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          Loading...
        </Frimousse.Loading>
        <Frimousse.Empty className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-muted-foreground">
          {({ search }) => <>No emoji for &ldquo;{search}&rdquo;</>}
        </Frimousse.Empty>
        <Frimousse.List
          aria-label="Emoji"
          className="select-none"
          components={{
            CategoryHeader: ({ category, ...props }) => (
              <div
                {...props}
                className={cn(
                  'bg-popover px-2 pb-1.5 pt-3 text-xs font-medium text-muted-foreground',
                  props.className,
                )}
              >
                {category.label}
              </div>
            ),
            Row: ({ children, ...props }) => (
              <div
                {...props}
                className={cn('group/row flex px-1.5', props.className)}
                data-row={rowParity(props)}
              >
                {children}
              </div>
            ),
            Emoji: ({ emoji, ...props }) => (
              <button type="button" {...props} className={cn(EMOJI_BUTTON, props.className)}>
                {emoji.emoji}
              </button>
            ),
          }}
        />
      </Frimousse.Viewport>
      <div className="flex h-11 items-center gap-2 border-t border-border/60 px-3">
        <Frimousse.ActiveEmoji>
          {({ emoji }) =>
            emoji ? (
              <span className="flex min-w-0 items-center gap-2">
                <span className="text-lg leading-none">{emoji.emoji}</span>
                <span className="truncate text-xs text-muted-foreground">{emoji.label}</span>
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Pick an emoji</span>
            )
          }
        </Frimousse.ActiveEmoji>
        <Frimousse.SkinToneSelector className="ml-auto flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-base transition-colors hover:bg-muted" />
      </div>
    </Frimousse.Root>
  );
}
