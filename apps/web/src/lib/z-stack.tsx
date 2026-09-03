import * as React from 'react';

const DialogDepthContext = React.createContext(0);

export function DialogDepthProvider({
  depth,
  children,
}: {
  depth: number;
  children: React.ReactNode;
}) {
  return <DialogDepthContext.Provider value={depth}>{children}</DialogDepthContext.Provider>;
}

export function useDialogDepth() {
  return React.useContext(DialogDepthContext);
}

export function dialogOverlayZ(depth: number) {
  const level = Math.max(1, depth);
  return 9998 + (level - 1) * 20;
}

export function dialogContentZ(depth: number) {
  const level = Math.max(1, depth);
  return 9999 + (level - 1) * 20;
}

export function floatingZ(depth: number) {
  return depth <= 0 ? 10001 : dialogContentZ(depth) + 2;
}
