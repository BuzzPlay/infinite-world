import { cn } from '@/lib/utils';

const RADIUS = 7;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ProgressRing({ value, className, trackClassName = 'text-foreground/10', progressClassName = 'text-muted-foreground' }: { value: number; className?: string; trackClassName?: string; progressClassName?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return <svg viewBox="0 0 18 18" className={cn('size-4 -rotate-90', className)} fill="none" aria-hidden="true"><circle cx="9" cy="9" r={RADIUS} stroke="currentColor" strokeWidth="2" className={trackClassName} /><circle cx="9" cy="9" r={RADIUS} stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={cn('transition-[stroke-dashoffset] duration-500', progressClassName)} strokeDasharray={CIRCUMFERENCE} strokeDashoffset={CIRCUMFERENCE * (1 - clamped / 100)} /></svg>;
}
