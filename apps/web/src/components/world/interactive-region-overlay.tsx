import type { InteractiveRegionSnapshot } from '@infinite-world/api-contract';
import { cn } from '@/lib/utils';

interface InteractiveRegionOverlayProps {
  regions: InteractiveRegionSnapshot[];
  selectedRegionId: string | null;
  disabled: boolean;
  onSelect: (regionId: string) => void;
}

export function InteractiveRegionOverlay({
  regions,
  selectedRegionId,
  disabled,
  onSelect,
}: InteractiveRegionOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {regions.map((region) => (
        <button
          key={region.id}
          type="button"
          className={cn(
            'group pointer-events-auto absolute rounded-md border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/80',
          )}
          style={{
            left: `${region.x * 100}%`,
            top: `${region.y * 100}%`,
            width: `${region.width * 100}%`,
            height: `${region.height * 100}%`,
          }}
          disabled={disabled}
          onClick={() => onSelect(region.id)}
          aria-label={region.label}
          title={region.label}
        >
          <span
            className={cn(
              'absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-blue transition-[box-shadow,transform] group-hover:scale-125',
              selectedRegionId === region.id
                ? 'size-4 shadow-[0_0_0_5px_rgba(59,130,246,0.3),0_0_18px_rgba(59,130,246,0.8)]'
                : 'size-3 shadow-[0_0_0_3px_rgba(59,130,246,0.2),0_0_12px_rgba(59,130,246,0.65)]',
            )}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
}
