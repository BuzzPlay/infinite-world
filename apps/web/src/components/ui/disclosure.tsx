import { AnimatePresence, m, MotionConfig, type Transition, type Variant, type Variants } from 'motion/react';
import * as React from 'react';

import { cn } from '@/lib/utils';

export type DisclosureContextType = {
  open: boolean;
  toggle: () => void;
  contentId: string;
  variants?: { expanded: Variant; collapsed: Variant };
};

const DisclosureContext = React.createContext<DisclosureContextType | undefined>(undefined);

export function resolveDisclosureToggle(state: { open: boolean; isControlled: boolean }): {
  nextOpen: boolean;
  writesInternalState: boolean;
} {
  return { nextOpen: !state.open, writesInternalState: !state.isControlled };
}

export type DisclosureProviderProps = {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  variants?: { expanded: Variant; collapsed: Variant };
};

function DisclosureProvider({
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  variants,
}: DisclosureProviderProps) {
  const isControlled = openProp !== undefined;
  const contentId = React.useId();
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const open = isControlled ? openProp : uncontrolledOpen;

  const toggle = React.useCallback(() => {
    const { nextOpen, writesInternalState } = resolveDisclosureToggle({ open, isControlled });
    if (writesInternalState) setUncontrolledOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }, [open, isControlled, onOpenChange]);

  const contextValue = React.useMemo(
    () => ({ open, toggle, contentId, variants }),
    [open, toggle, contentId, variants],
  );

  return <DisclosureContext.Provider value={contextValue}>{children}</DisclosureContext.Provider>;
}

function useDisclosure() {
  const context = React.useContext(DisclosureContext);
  if (!context) {
    throw new Error('useDisclosure must be used within a DisclosureProvider');
  }
  return context;
}

export type DisclosureProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  variants?: { expanded: Variant; collapsed: Variant };
  transition?: Transition;
  variant?: 'default' | 'outline';
};

function DisclosureRoot({ className, children }: { className?: string; children: React.ReactNode }) {
  const { open } = useDisclosure();
  return (
    <div className={className} data-state={open ? 'open' : 'closed'}>
      {children}
    </div>
  );
}

export function Disclosure({
  open: openProp,
  defaultOpen,
  onOpenChange,
  children,
  className,
  transition,
  variants,
  variant = 'default',
}: DisclosureProps) {
  const childArray = React.Children.toArray(children);

  return (
    <MotionConfig transition={transition}>
      <DisclosureProvider
        open={openProp}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
        variants={variants}
      >
        <DisclosureRoot
          className={cn(
            variant === 'outline' && 'group border-border w-full rounded-md border shadow-none',
            className,
          )}
        >
          {childArray}
        </DisclosureRoot>
      </DisclosureProvider>
    </MotionConfig>
  );
}

export function DisclosureTrigger({
  children,
  className,
  variant = 'default',
}: {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline';
}) {
  const { toggle, open, contentId } = useDisclosure();

  return (
    <>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;

        type ButtonLikeProps = {
          onClick?: React.MouseEventHandler;
          role?: string;
          'aria-expanded'?: boolean;
          'aria-controls'?: string;
          tabIndex?: number;
          onKeyDown?: React.KeyboardEventHandler;
          className?: string;
        };

        const typedChild = child as React.ReactElement<ButtonLikeProps>;
        return React.cloneElement(typedChild, {
          onClick: (event) => {
            typedChild.props.onClick?.(event);
            if (!event.defaultPrevented) toggle();
          },
          role: 'button',
          'aria-expanded': open,
          'aria-controls': open ? contentId : undefined,
          tabIndex: 0,
          onKeyDown: (event) => {
            typedChild.props.onKeyDown?.(event);
            if (event.defaultPrevented) return;
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              toggle();
            }
          },
          className: cn(
            className,
            'select-none',
            typedChild.props.className,
            variant === 'outline' &&
              'group-data-[state=open]:rounded-b-none group-data-[state=open]:border-b-0',
          ),
        });
      })}
    </>
  );
}

export function DisclosureContent({
  children,
  className,
  contentClassName,
  variant = 'default',
}: {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  variant?: 'default' | 'outline';
}) {
  const { open, variants, contentId } = useDisclosure();
  const baseVariants: Variants = {
    expanded: { height: 'auto', opacity: 1 },
    collapsed: { height: 0, opacity: 0 },
  };
  const combinedVariants = {
    expanded: { ...baseVariants.expanded, ...variants?.expanded },
    collapsed: { ...baseVariants.collapsed, ...variants?.collapsed },
  };

  return (
    <div
      className={cn(
        'overflow-hidden',
        variant === 'outline' && 'group-data-[state=open]:rounded-b-md',
        className,
      )}
    >
      <AnimatePresence initial={false}>
        {open && (
          <m.div
            id={contentId}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={combinedVariants}
            className={contentClassName}
          >
            {children}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export type DisclosureBodyProps = {
  children: React.ReactNode;
  className?: string;
};

export function DisclosureBody({ children, className }: DisclosureBodyProps) {
  return <div className={cn('p-3 pt-0', className)}>{children}</div>;
}

export { DisclosureProvider, useDisclosure };

export default {
  Disclosure,
  DisclosureBody,
  DisclosureProvider,
  DisclosureTrigger,
  DisclosureContent,
};
