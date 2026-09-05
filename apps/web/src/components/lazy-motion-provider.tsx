'use client';

import { LazyMotion } from 'motion/react';
import type { ReactNode } from 'react';

const loadDomAnimationFeatures = () =>
  import('@/lib/motion/dom-animation').then((module) => module.domAnimation);

export function LazyMotionProvider({ children }: { children: ReactNode }) {
  return <LazyMotion features={loadDomAnimationFeatures}>{children}</LazyMotion>;
}
