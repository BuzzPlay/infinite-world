import { cn } from '@/lib/utils';
import { STATUS_RING } from './status-ring';

type LoadingVariant = 'orbit' | 'spokes' | 'ring';

const SPOKE_COUNT = 8;
const SPOKE_KEYS = [
  'north',
  'northeast',
  'east',
  'southeast',
  'south',
  'southwest',
  'west',
  'northwest',
];

export function Loading({
  className,
  variant = 'orbit',
}: {
  className?: string;
  variant?: LoadingVariant;
}) {
  const base = cn('size-4 text-foreground', className);

  if (variant === 'spokes') {
    return (
      <svg
        className={cn(base, 'animate-spinner-spokes')}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        {SPOKE_KEYS.map((key, index) => (
          <line
            key={key}
            x1="12"
            y1="2.5"
            x2="12"
            y2="7.5"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity={1 - index * 0.1}
            transform={`rotate(${(index * 360) / SPOKE_COUNT} 12 12)`}
          />
        ))}
      </svg>
    );
  }

  if (variant === 'ring') {
    return (
      <svg
        className={cn(base, 'animate-spinner-orbit')}
        viewBox={`0 0 ${STATUS_RING.BOX} ${STATUS_RING.BOX}`}
        fill="none"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx={STATUS_RING.CENTER}
          cy={STATUS_RING.CENTER}
          r={STATUS_RING.RADIUS}
          stroke="currentColor"
          strokeWidth={STATUS_RING.STROKE}
          pathLength="62.83"
        />
        <circle
          className="animate-spinner-dash"
          cx={STATUS_RING.CENTER}
          cy={STATUS_RING.CENTER}
          r={STATUS_RING.RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={STATUS_RING.STROKE}
          strokeLinecap="round"
          pathLength="62.83"
        />
      </svg>
    );
  }

  return (
    <svg
      className={cn(base, 'animate-spinner-orbit')}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <circle
        className="animate-spinner-dash"
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default Loading;
